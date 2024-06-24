import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ScenarioData, ScenarioDataDocument, Variable } from './scenarioData.schema';
import { DecisionsService } from '../decisions/decisions.service';
import { RuleMappingService } from '../ruleMapping/ruleMapping.service';
import * as csvParser from 'csv-parser';
import { RuleSchema, RuleRunResults } from './scenarioData.interface';
@Injectable()
export class ScenarioDataService {
  constructor(
    private decisionsService: DecisionsService,
    private ruleMappingService: RuleMappingService,

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
      return await this.scenarioDataModel.find({ goRulesJSONFilename: goRulesJSONFilename }).exec();
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
    newScenarios?: ScenarioData[],
  ): Promise<{ [scenarioId: string]: any }> {
    const scenarios = newScenarios || (await this.getScenariosByFilename(goRulesJSONFilename));
    const ruleSchema: RuleSchema = await this.ruleMappingService.ruleSchemaFile(goRulesJSONFilename);
    const results: { [scenarioId: string]: any } = {};

    const getPropertyById = (id: string, type: 'input' | 'output') => {
      const schema = type === 'input' ? ruleSchema.inputs : ruleSchema.finalOutputs;
      const item = schema.find((item: any) => item.id === id);
      return item ? item.property : null;
    };

    const mapTraceToResult = (trace: any, type: 'input' | 'output') => {
      const result: { [key: string]: any } = {};
      const schema = type === 'input' ? ruleSchema.inputs : ruleSchema.finalOutputs;

      for (const [key, value] of Object.entries(trace)) {
        const property = getPropertyById(key, type);
        if (property) {
          result[property] = value;
        } else {
          // Direct match without id
          const directMatch = schema.find((item: any) => item.property === key);
          if (directMatch) {
            result[directMatch.property] = value;
          }
        }
      }

      return result;
    };

    const isEqual = (obj1: any, obj2: any) => {
      if (obj1 === obj2) return true;
      if (obj1 == null || obj2 == null) return false;
      if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);

      if (keys1.length !== keys2.length) return false;

      for (const key of keys1) {
        if (!keys2.includes(key) || !isEqual(obj1[key], obj2[key])) return false;
      }

      return true;
    };

    for (const scenario of scenarios) {
      const variablesObject = scenario?.variables?.reduce((acc: any, obj: any) => {
        acc[obj.name] = obj.value;
        return acc;
      }, {});

      const expectedResultsObject = scenario?.expectedResults?.reduce((acc: any, obj: any) => {
        acc[obj.name] = obj.value;
        return acc;
      }, {});

      try {
        const decisionResult = await this.decisionsService.runDecisionByFile(
          scenario.goRulesJSONFilename,
          variablesObject,
          { trace: true },
        );

        const resultMatches =
          Object.keys(expectedResultsObject).length > 0 ? isEqual(decisionResult.result, expectedResultsObject) : true;

        console.log(expectedResultsObject, resultMatches, decisionResult.result);
        const scenarioResult = {
          inputs: {},
          outputs: {},
          expectedResults: expectedResultsObject || {},
          result: decisionResult.result || {},
          resultMatch: resultMatches,
        };

        // Map inputs and outputs based on the trace
        for (const trace of Object.values(decisionResult.trace)) {
          if (trace.input) {
            Object.assign(scenarioResult.inputs, mapTraceToResult(trace.input, 'input'));
          }
          if (trace.output) {
            Object.assign(scenarioResult.outputs, mapTraceToResult(trace.output, 'output'));
          }
        }

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
  async getCSVForRuleRun(goRulesJSONFilename: string, newScenarios?: ScenarioData[]): Promise<string> {
    const ruleRunResults: RuleRunResults = await this.runDecisionsForScenarios(goRulesJSONFilename, newScenarios);

    const inputKeys = Array.from(
      new Set(Object.values(ruleRunResults).flatMap((scenario) => Object.keys(scenario.inputs))),
    );
    const outputKeys = Array.from(
      new Set(
        Object.values(ruleRunResults).flatMap((scenario) => {
          if (scenario.result) {
            return Object.keys(scenario.result);
          }
          return [];
        }),
      ),
    );
    const expectedResultsKeys = Array.from(
      new Set(
        Object.values(ruleRunResults).flatMap((scenario) => {
          if (scenario.expectedResults) {
            return Object.keys(scenario.expectedResults);
          }
          return [];
        }),
      ),
    );

    const headers = [
      'Scenario',
      'Results Match Expected (Pass/Fail)',
      ...inputKeys.map((key) => `Input: ${key}`),
      ...expectedResultsKeys.map((key) => `Expected Result: ${key}`),
      ...outputKeys.map((key) => `Result: ${key}`),
    ];

    const rows = Object.entries(ruleRunResults).map(([scenarioName, scenarioData]) => {
      const resultsMatch = scenarioData.resultMatch ? 'Pass' : 'Fail';
      const inputs = inputKeys.map((key) => scenarioData.inputs[key] ?? '');
      const outputs = outputKeys.map((key) => scenarioData.result[key] ?? '');
      const expectedResults = expectedResultsKeys.map((key) => scenarioData.expectedResults[key] ?? '');

      return [scenarioName, resultsMatch, ...inputs, ...expectedResults, ...outputs];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    return csvContent;
  }

  async parseCSV(file: Express.Multer.File | undefined): Promise<string[][]> {
    return new Promise((resolve, reject) => {
      const results: string[][] = [];
      const stream = csvParser({ headers: false });

      stream.on('data', (data) => results.push(Object.values(data)));
      stream.on('end', () => resolve(results));
      stream.on('error', (error) => reject(error));

      stream.write(file.buffer);
      stream.end();
    });
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
    const parsedData = await this.parseCSV(csvContent);
    const headers = parsedData[0];

    const inputKeys = headers
      .filter((header) => header.startsWith('Input: '))
      .map((header) => header.replace('Input: ', ''));

    const expectedResultsKeys = headers
      .filter((header) => header.startsWith('Expected Result: '))
      .map((header) => header.replace('Expected Result: ', ''));

    const scenarios: ScenarioData[] = [];

    function formatValue(value: string): boolean | number | string {
      if (value.toLowerCase() === 'true') {
        return true;
      } else if (value.toLowerCase() === 'false') {
        return false;
      }
      const numberValue = parseFloat(value);
      if (!isNaN(numberValue)) {
        return numberValue;
      }
      if (value === '') {
        return null;
      }
      return value;
    }

    for (let i = 1; i < parsedData.length; i++) {
      const row = parsedData[i];
      const scenarioTitle = row[0];

      const inputs: Variable[] = inputKeys.map((key, index) => {
        // Adjusted index to account for scenario title and results match
        const value = row[index + 2] ? formatValue(row[index + 2]) : null;
        return {
          name: key,
          value: value,
          type: typeof value,
        };
      });

      // Adjusted index to account for scenario title, results match, and inputs in csv layout
      const expectedResultsStartIndex = 2 + inputKeys.length;
      const expectedResults: Variable[] = expectedResultsKeys
        .map((key, index) => {
          const value = row[expectedResultsStartIndex + index]
            ? formatValue(row[expectedResultsStartIndex + index])
            : null;
          if (value !== null && value !== undefined && value !== '') {
            return {
              name: key,
              value: value,
              type: typeof value,
            };
          }
          return undefined;
        })
        .filter((entry) => entry !== undefined);

      const scenario: ScenarioData = {
        _id: new Types.ObjectId(),
        title: scenarioTitle,
        ruleID: '',
        variables: inputs,
        goRulesJSONFilename: goRulesJSONFilename,
        expectedResults: expectedResults || [],
      };

      scenarios.push(scenario);
    }

    return scenarios;
  }
}
