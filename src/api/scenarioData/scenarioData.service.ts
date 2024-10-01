import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ScenarioData, ScenarioDataDocument } from './scenarioData.schema';
import { RuleContent } from '../ruleMapping/ruleMapping.interface';
import { DecisionsService } from '../decisions/decisions.service';
import { RuleMappingService } from '../ruleMapping/ruleMapping.service';
import { DocumentsService } from '../documents/documents.service';
import { RuleSchema, RuleRunResults } from './scenarioData.interface';
import { isEqual, reduceToCleanObj, extractUniqueKeys } from '../../utils/helpers';
import { mapTraces } from '../../utils/handleTrace';
import { parseCSV, extractKeys, formatVariables, cartesianProduct, complexCartesianProduct } from '../../utils/csv';

@Injectable()
export class ScenarioDataService {
  constructor(
    private decisionsService: DecisionsService,
    private ruleMappingService: RuleMappingService,
    private documentsService: DocumentsService,
    @InjectModel(ScenarioData.name) private scenarioDataModel: Model<ScenarioDataDocument>,
  ) {}

  async getAllScenarioData(): Promise<ScenarioData[]> {
    try {
      const scenarioDataList = await this.scenarioDataModel.find().exec();
      return scenarioDataList;
    } catch (error) {
      throw new Error(`Error getting all scenario data: ${error.message}`);
    }
  }

  async getScenarioData(scenarioId: string): Promise<ScenarioData> {
    try {
      const scenarioData = await this.scenarioDataModel.findOne({ _id: scenarioId }).exec();
      if (!scenarioData) {
        throw new Error('Scenario data not found');
      }
      return scenarioData;
    } catch (error) {
      throw new Error(`Error getting scenario data: ${error.message}`);
    }
  }

  async createScenarioData(scenarioData: ScenarioData): Promise<ScenarioData> {
    try {
      const newScenarioData = new this.scenarioDataModel(scenarioData);
      const response = await newScenarioData.save();
      return response;
    } catch (error) {
      console.error('Error in createScenarioData:', error);
      throw new Error(`Failed to add scenario data: ${error.message}`);
    }
  }

  async updateScenarioData(scenarioId: string, updatedData: Partial<ScenarioData>): Promise<ScenarioData> {
    try {
      const existingScenarioData = await this.scenarioDataModel.findOne({ _id: scenarioId }).exec();
      if (!existingScenarioData) {
        throw new Error('Scenario data not found');
      }
      Object.assign(existingScenarioData, updatedData);
      return await existingScenarioData.save();
    } catch (error) {
      throw new Error(`Failed to update scenario data: ${error.message}`);
    }
  }
  ƒ;
  async deleteScenarioData(scenarioId: string): Promise<void> {
    try {
      const objectId = new Types.ObjectId(scenarioId);
      const deletedScenarioData = await this.scenarioDataModel.findOneAndDelete({ _id: objectId });
      if (!deletedScenarioData) {
        throw new Error('Scenario data not found');
      }
      return;
    } catch (error) {
      throw new Error(`Failed to delete scenario data: ${error.message}`);
    }
  }

  async getScenariosByRuleId(ruleId: string): Promise<ScenarioData[]> {
    try {
      return await this.scenarioDataModel.find({ ruleID: ruleId }).exec();
    } catch (error) {
      throw new Error(`Error getting scenarios by rule ID: ${error.message}`);
    }
  }

  async getScenariosByFilename(goRulesJSONFilename: string): Promise<ScenarioData[]> {
    try {
      return await this.scenarioDataModel.find({ goRulesJSONFilename: { $eq: goRulesJSONFilename } }).exec();
    } catch (error) {
      throw new Error(`Error getting scenarios by filename: ${error.message}`);
    }
  }

  /**
   * Runs decisions for multiple scenarios based on the provided rules JSON file.
   * Retrieves scenarios, retrieves rule schema, and executes decisions for each scenario.
   * Maps inputs and outputs from decision traces to structured results.
   */
  async runDecisionsForScenarios(
    goRulesJSONFilename: string,
    ruleContent?: RuleContent,
    newScenarios?: ScenarioData[],
  ): Promise<{ [scenarioId: string]: any }> {
    const scenarios = newScenarios || (await this.getScenariosByFilename(goRulesJSONFilename));
    if (!ruleContent) {
      const fileContent = await this.documentsService.getFileContent(goRulesJSONFilename);
      ruleContent = await JSON.parse(fileContent.toString());
    }
    const ruleSchema: RuleSchema = await this.ruleMappingService.inputOutputSchema(ruleContent);
    const results: { [scenarioId: string]: any } = {};

    for (const scenario of scenarios as ScenarioDataDocument[]) {
      const formattedVariablesObject = reduceToCleanObj(scenario?.variables, 'name', 'value');
      const formattedExpectedResultsObject = reduceToCleanObj(scenario?.expectedResults, 'name', 'value');

      try {
        const decisionResult = await this.decisionsService.runDecision(
          ruleContent,
          goRulesJSONFilename,
          formattedVariablesObject,
          {
            trace: true,
          },
        );

        const resultMatches =
          Object.keys(formattedExpectedResultsObject).length > 0
            ? isEqual(decisionResult.result, formattedExpectedResultsObject)
            : true;

        const scenarioResult = {
          inputs: mapTraces(decisionResult.trace, ruleSchema, 'input'),
          outputs: mapTraces(decisionResult.trace, ruleSchema, 'output'),
          expectedResults: formattedExpectedResultsObject || {},
          result: decisionResult.result || {},
          resultMatch: resultMatches,
        };

        results[scenario.title.toString()] = scenarioResult;
      } catch (error) {
        console.error(`Error running decision for scenario ${scenario._id}: ${error.message}`);
        results[scenario._id.toString()] = { error: error.message };
      }
    }
    return results;
  }

  /**
   * Generates a CSV string based on the results of running decisions for scenarios.
   * Retrieves scenario results, extracts unique input and output keys, and maps them to CSV rows.
   * Constructs CSV headers and rows based on input and output keys.
   */
  async getCSVForRuleRun(
    goRulesJSONFilename: string,
    ruleContent: RuleContent,
    newScenarios?: ScenarioData[],
  ): Promise<string> {
    const ruleRunResults: RuleRunResults = await this.runDecisionsForScenarios(
      goRulesJSONFilename,
      ruleContent,
      newScenarios,
    );

    const keys = {
      inputs: extractUniqueKeys(ruleRunResults, 'inputs'),
      expectedResults: extractUniqueKeys(ruleRunResults, 'expectedResults'),
      result: extractUniqueKeys(ruleRunResults, 'result'),
    };

    const headers = [
      'Scenario',
      'Results Match Expected (Pass/Fail)',
      ...this.prefixKeys(keys.inputs, 'Input'),
      ...this.prefixKeys(keys.expectedResults, 'Expected Result'),
      ...this.prefixKeys(keys.result, 'Result'),
    ];

    const rows = Object.entries(ruleRunResults).map(([scenarioName, data]) => [
      this.escapeCSVField(scenarioName),
      data.resultMatch ? 'Pass' : 'Fail',
      ...this.mapFields(data.inputs, keys.inputs),
      ...this.mapFields(data.expectedResults, keys.expectedResults),
      ...this.mapFields(data.result, keys.result),
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  private prefixKeys(keys: string[], prefix: string): string[] {
    return keys.map((key) => `${prefix}: ${key}`);
  }

  private mapFields(data: Record<string, any>, keys: string[]): string[] {
    return keys.map((key) => this.escapeCSVField(data[key]));
  }

  private escapeCSVField(field: any): string {
    if (field == null) return '';
    if (typeof field === 'object') return `${field.length}`;
    const stringField = typeof field === 'string' ? field : String(field);
    return stringField.includes(',') ? `"${stringField.replace(/"/g, '""')}"` : stringField;
  }

  /**
   * Processes a CSV file containing scenario data and returns an array of ScenarioData objects based on the inputs.
   * @param goRulesJSONFilename The name of the Go rules JSON file.
   * @param csvContent The CSV file content.
   * @returns An array of ScenarioData objects.
   */
  async processProvidedScenarios(
    goRulesJSONFilename: string,
    csvContent: Express.Multer.File,
  ): Promise<ScenarioData[]> {
    const parsedData = await parseCSV(csvContent);
    if (!parsedData || parsedData.length === 0) {
      throw new Error('CSV content is empty or invalid');
    }

    const headers = parsedData[0];

    const inputKeys = extractKeys(headers, 'Input: ') || [];
    const expectedResultsKeys = extractKeys(headers, 'Expected Result: ') || [];

    const scenarios: ScenarioData[] = [];

    parsedData.slice(1).forEach((row) => {
      const scenarioTitle = row[0];

      const inputs = formatVariables(row, inputKeys, 2);
      const expectedResultsStartIndex = 2 + inputKeys.length;
      const expectedResults = formatVariables(row, expectedResultsKeys, expectedResultsStartIndex, true);

      const scenario: ScenarioData = {
        title: scenarioTitle,
        ruleID: '',
        variables: inputs,
        goRulesJSONFilename: goRulesJSONFilename,
        expectedResults: expectedResults,
      };

      scenarios.push(scenario);
    });

    return scenarios;
  }

  async generateCSVScenarios(
    goRulesJSONFilename: string,
    ruleContent: RuleContent,
    newScenarios?: ScenarioData[],
  ): Promise<string> {
    const ruleRunResults: RuleRunResults = await this.runDecisionsForScenarios(
      goRulesJSONFilename,
      ruleContent,
      newScenarios,
    );

    const keys = {
      inputs: extractUniqueKeys(ruleRunResults, 'inputs'),
      expectedResults: extractUniqueKeys(ruleRunResults, 'expectedResults'),
      result: extractUniqueKeys(ruleRunResults, 'result'),
    };

    const headers = [
      'Scenario',
      'Results Match Expected (Pass/Fail)',
      ...this.prefixKeys(keys.inputs, 'Input'),
      ...this.prefixKeys(keys.expectedResults, 'Expected Result'),
      ...this.prefixKeys(keys.result, 'Result'),
    ];

    const rows = Object.entries(ruleRunResults).map(([scenarioName, data]) => [
      this.escapeCSVField(scenarioName),
      data.resultMatch ? 'Pass' : 'Fail',
      ...this.mapFields(data.inputs, keys.inputs),
      ...this.mapFields(data.expectedResults, keys.expectedResults),
      ...this.mapFields(data.result, keys.result),
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  private generatePossibleValues(input: any, defaultValue?: any): any[] {
    const { type, dataType, validationCriteria, validationType, childFields } = input;

    if (defaultValue !== null && defaultValue !== undefined) return [defaultValue];

    switch (type || dataType) {
      case 'object-array':
        const childCombinations = this.generateCombinations({ inputs: childFields });
        return [childCombinations];

      case 'number-input':
        const numberValues = validationCriteria?.split(',').map((val: string) => val.trim());
        const minValue = (numberValues && parseInt(numberValues[0], 10)) || 0;

        const maxValue =
          numberValues && numberValues[numberValues?.length - 1] !== minValue.toString()
            ? numberValues[numberValues?.length - 1]
            : 20;

        const generateRandomNumbers = (count: number) =>
          Array.from({ length: count }, () => Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue);

        switch (validationType) {
          case '>=':
            return generateRandomNumbers(5);
          case '<=':
            return generateRandomNumbers(5);
          case '>':
            return generateRandomNumbers(5).filter((val) => val > minValue);
          case '<':
            return generateRandomNumbers(5).filter((val) => val < maxValue);
          // range exclusive
          case '(num)':
            return generateRandomNumbers(5).filter((val) => val > minValue && val < maxValue);
          // range inclusive
          case '[num]':
            return generateRandomNumbers(5);
          default:
            return generateRandomNumbers(5);
        }

      case 'date':
        const dateValues = validationCriteria?.split(',').map((val: string) => new Date(val.trim()).getTime());
        const minDate = (dateValues && dateValues[0]) || new Date().getTime();
        const maxDate =
          dateValues && dateValues[dateValues?.length - 1] !== minDate
            ? dateValues[dateValues?.length - 1]
            : new Date().setFullYear(new Date().getFullYear() + 1);
        const generateRandomDates = (count: number) =>
          Array.from({ length: count }, () =>
            new Date(minDate + Math.random() * (maxDate - minDate)).toISOString().slice(0, 10),
          );
        switch (validationType) {
          case '>=':
            return generateRandomDates(5);
          case '<=':
            return generateRandomDates(5);
          case '>':
            return generateRandomDates(5).filter((date) => new Date(date).getTime() > minDate);
          case '<':
            return generateRandomDates(5).filter((date) => new Date(date).getTime() < maxDate);
          // range exclusive
          case '(date)':
            return generateRandomDates(5).filter(
              (date) => new Date(date).getTime() > minDate && new Date(date).getTime() < maxDate,
            );
          // range inclusive
          case '[date]':
            return generateRandomDates(5);
          default:
            return generateRandomDates(5);
        }

      case 'text-input':
        return validationCriteria.split(',').map((val: string) => val.trim());

      case 'true-false':
        return [true, false];

      default:
        return [];
    }
  }

  private generateCombinations(data: any, simulationContext?, testScenarioCount?) {
    const generateFieldPath = (field: string, parentPath: string = ''): string => {
      return parentPath ? `${parentPath}.${field}` : field;
    };

    const mapInputs = (inputs: any[], parentPath: string = ''): { fields: string[]; values: any[][] } => {
      return inputs.reduce(
        (acc, input) => {
          const currentPath = generateFieldPath(input.field, parentPath);
          if (input.type === 'object-array') {
            return {
              fields: [...acc.fields, currentPath],
              values: [...acc.values, this.generatePossibleValues(input)],
            };
          } else if (input.childFields && input.childFields.length > 0) {
            const childResult = mapInputs(input.childFields, currentPath);
            return {
              fields: [...acc.fields, ...childResult.fields],
              values: [...acc.values, ...childResult.values],
            };
          } else {
            const defaultValue = simulationContext?.[input.field];
            const possibleValues = this.generatePossibleValues(input, defaultValue);
            return {
              fields: [...acc.fields, currentPath],
              values: [...acc.values, possibleValues],
            };
          }
        },
        { fields: [], values: [] },
      );
    };

    const { fields, values } = mapInputs(data.inputs);

    const possibleCombinationLength = values.reduce((acc, val) => acc * val.length, 1);
    const inputCombinations =
      possibleCombinationLength > 1000 ? complexCartesianProduct(values, testScenarioCount) : cartesianProduct(values);

    // Map combinations back to fields
    const resultObjects = this.generateObjectsFromCombinations(fields, inputCombinations);
    return resultObjects;
  }

  private generateObjectsFromCombinations(fields: string[], combinations: any[][]) {
    return combinations.map((combination) => {
      const obj: { [key: string]: any } = {};
      fields.forEach((field, index) => {
        const fieldParts = field.split('.');
        let currentObj = obj;
        for (let i = 0; i < fieldParts.length - 1; i++) {
          if (!currentObj[fieldParts[i]]) {
            currentObj[fieldParts[i]] = Array.isArray(combination[index]) ? [] : {};
          }
          currentObj = currentObj[fieldParts[i]];
        }
        const lastPart = fieldParts[fieldParts.length - 1];
        if (Array.isArray(combination[index])) {
          currentObj[lastPart] = combination[index];
        } else {
          currentObj[lastPart] = combination[index];
        }
      });
      return obj;
    });
  }

  async generateTestScenarios(
    goRulesJSONFilename: string,
    ruleContent?: RuleContent,
    simulationContext?,
    testScenarioCount?: number,
  ): Promise<{ [scenarioId: string]: any }> {
    if (!ruleContent) {
      const fileContent = await this.documentsService.getFileContent(goRulesJSONFilename);
      ruleContent = await JSON.parse(fileContent.toString());
    }
    const ruleSchema: RuleSchema = await this.ruleMappingService.inputOutputSchema(ruleContent);
    const results: { [scenarioId: string]: any } = {};

    const combinations = this.generateCombinations(ruleSchema, simulationContext, testScenarioCount).slice(
      0,
      testScenarioCount || 100,
    );

    const formattedExpectedResultsObject = reduceToCleanObj(ruleSchema.resultOutputs, 'name', 'value');
    let nameCounter = 1;
    for (const scenario of combinations as ScenarioDataDocument[]) {
      const formattedVariablesObject = scenario;
      const title = `testCase${nameCounter++}`;

      try {
        const decisionResult = await this.decisionsService.runDecision(
          ruleContent,
          goRulesJSONFilename,
          formattedVariablesObject,
          {
            trace: true,
          },
        );

        const resultMatches =
          Object.keys(formattedExpectedResultsObject).length > 0
            ? isEqual(decisionResult.result, formattedExpectedResultsObject)
            : true;

        const scenarioResult = {
          inputs: mapTraces(decisionResult.trace, ruleSchema, 'input'),
          outputs: mapTraces(decisionResult.trace, ruleSchema, 'output'),
          expectedResults: formattedExpectedResultsObject || {},
          result: decisionResult.result || {},
          resultMatch: resultMatches,
        };

        results[title] = scenarioResult;
      } catch (error) {
        console.error(`Error running decision for scenario ${title}: ${error.message}`);
        results[title] = { error: error.message };
      }
    }
    return results;
  }

  async generateTestCSVScenarios(
    goRulesJSONFilename: string,
    ruleContent: RuleContent,
    simulationContext: RuleRunResults,
    testScenarioCount?: number,
  ) {
    const ruleRunResults: RuleRunResults = await this.generateTestScenarios(
      goRulesJSONFilename,
      ruleContent,
      simulationContext,
      testScenarioCount,
    );

    const keys = {
      inputs: extractUniqueKeys(ruleRunResults, 'inputs'),
      expectedResults: extractUniqueKeys(ruleRunResults, 'expectedResults'),
      result: extractUniqueKeys(ruleRunResults, 'result'),
    };

    const headers = [
      'Scenario',
      'Results Match Expected (Pass/Fail)',
      ...this.prefixKeys(keys.inputs, 'Input'),
      ...this.prefixKeys(keys.expectedResults, 'Expected Result'),
      ...this.prefixKeys(keys.result, 'Result'),
    ];

    const rows = Object.entries(ruleRunResults).map(([scenarioName, data]) => [
      this.escapeCSVField(scenarioName),
      `n/a`,
      ...this.mapFields(data.inputs, keys.inputs),
      ...this.mapFields(data.expectedResults, keys.expectedResults),
      ...this.mapFields(data.result, keys.result),
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }
}
