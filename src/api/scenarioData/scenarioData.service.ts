import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ScenarioData, ScenarioDataDocument, Variable } from './scenarioData.schema';
import { DecisionsService } from '../decisions/decisions.service';
import { RuleMappingService } from '../ruleMapping/ruleMapping.service';
import { RuleSchema, RuleRunResults } from './scenarioData.interface';
import { parseCSV, isEqual, reduceToCleanObj } from '../../utils/helpers';
import { mapTraces } from 'src/utils/handleTrace';

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

    for (const scenario of scenarios) {
      const formattedVariablesObject = reduceToCleanObj(scenario?.variables, 'name', 'value');
      const formattedExpectedResultsObject = reduceToCleanObj(scenario?.expectedResults, 'name', 'value');

      try {
        const decisionResult = await this.decisionsService.runDecisionByFile(
          scenario.goRulesJSONFilename,
          formattedVariablesObject,
          { trace: true },
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
