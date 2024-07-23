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
import { parseCSV, extractKeys, formatVariables } from '../../utils/csv';

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
    const ruleSchema: RuleSchema = await this.ruleMappingService.ruleSchema(ruleContent);
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
}
