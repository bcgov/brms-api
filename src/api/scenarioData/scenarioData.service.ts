import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ScenarioData, ScenarioDataDocument } from './scenarioData.schema';
import { DecisionsService } from '../decisions/decisions.service';
import { RuleMappingService } from '../ruleMapping/ruleMapping.service';
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

  isValidVariableStructure(variables: any[]): boolean {
    for (const variable of variables) {
      if (
        !variable ||
        typeof variable.name !== 'string' ||
        typeof variable.type !== 'string' ||
        (variable.value !== null && typeof variable.value === 'undefined')
      ) {
        return false;
      }
    }
    return true;
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
  async runDecisionsForScenarios(goRulesJSONFilename: string): Promise<{ [scenarioId: string]: any }> {
    const scenarios = await this.getScenariosByFilename(goRulesJSONFilename);
    const ruleSchema = await this.ruleMappingService.ruleSchemaFile(goRulesJSONFilename);
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

    for (const scenario of scenarios) {
      const variablesObject = scenario?.variables?.reduce((acc: any, obj: any) => {
        acc[obj.name] = obj.value;
        return acc;
      }, {});

      try {
        const decisionResult = await this.decisionsService.runDecisionByFile(
          scenario.goRulesJSONFilename,
          variablesObject,
          { trace: true },
        );

        const scenarioResult = { inputs: {}, outputs: {} };

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
  async getCSVForRuleRun(goRulesJSONFilename: string): Promise<string> {
    const ruleRunResults = await this.runDecisionsForScenarios(goRulesJSONFilename);
    const inputKeys = Array.from(
      new Set(Object.values(ruleRunResults).flatMap((scenario) => Object.keys(scenario.inputs))),
    );
    const outputKeys = Array.from(
      new Set(Object.values(ruleRunResults).flatMap((scenario) => Object.keys(scenario.outputs))),
    );

    const headers = [
      'Scenario',
      ...inputKeys.map((key) => `Input: ${key}`),
      ...outputKeys.map((key) => `Output: ${key}`),
    ];
    const rows = Object.entries(ruleRunResults).map(([scenarioName, scenarioData]) => {
      const inputs = inputKeys.map((key) => (scenarioData.inputs[key] !== undefined ? scenarioData.inputs[key] : ''));
      const outputs = outputKeys.map((key) =>
        scenarioData.outputs[key] !== undefined ? scenarioData.outputs[key] : '',
      );
      return [scenarioName, ...inputs, ...outputs];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    return csvContent;
  }
}
