import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ScenarioData, ScenarioDataDocument } from './scenarioData.schema';
import { DecisionsService } from '../decisions/decisions.service';
import { RuleMappingService } from '../ruleMapping/ruleMapping.service';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class ScenarioDataService {
  // constructor(@InjectModel(ScenarioData.name) private scenarioDataModel: Model<ScenarioDataDocument>) {}
  rulesDirectory: string;
  constructor(
    private decisionsService: DecisionsService,
    private ruleMappingService: RuleMappingService,
    private configService: ConfigService,
    @InjectModel(ScenarioData.name) private scenarioDataModel: Model<ScenarioDataDocument>,
  ) {
    this.rulesDirectory = this.configService.get<string>('RULES_DIRECTORY');
  }

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

  async runDecisionsForScenarios(goRulesJSONFilename: string): Promise<{ [scenarioId: string]: any }> {
    const scenarios = await this.getScenariosByFilename(goRulesJSONFilename);
    const ruleSchema = await this.ruleMappingService.ruleSchemaFile(goRulesJSONFilename);
    const results: { [scenarioId: string]: any } = {};

    const getPropertyById = (id: string, type: 'input' | 'output') => {
      const schema = type === 'input' ? ruleSchema.inputs : ruleSchema.finalOutputs;
      const item = schema.find((item: any) => item.id === id);
      return item ? item.property : null;
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

        // Map inputs and outputs based on the trace
        const scenarioResult = { inputs: {}, outputs: {} };
        for (const trace of Object.values(decisionResult.trace)) {
          // Map inputs
          if (trace.input) {
            for (const [key, value] of Object.entries(trace.input)) {
              const property = getPropertyById(key, 'input');
              if (property) {
                scenarioResult.inputs[property] = value;
              } else {
                // Direct match without id
                const directMatch = ruleSchema.inputs.find((input: any) => input.property === key);
                if (directMatch) {
                  scenarioResult.inputs[directMatch.property] = value;
                }
              }
            }
          }

          // Map outputs
          if (trace.output) {
            for (const [key, value] of Object.entries(trace.output)) {
              const property = getPropertyById(key, 'output');
              if (property) {
                scenarioResult.outputs[property] = value;
              } else {
                // Direct match without id
                const directMatch = ruleSchema.finalOutputs.find((output: any) => output.property === key);
                if (directMatch) {
                  scenarioResult.outputs[directMatch.property] = value;
                }
              }
            }
          }
        }

        results[scenario.title.toString()] = scenarioResult;
      } catch (error) {
        // Handle errors if needed
        console.error(`Error running decision for scenario ${scenario._id}: ${error.message}`);
        results[scenario._id.toString()] = { error: error.message };
      }
    }

    return results;
  }

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
    const rows = Object.entries(ruleRunResults).map(([scenarioName, scenarioData]) => [
      scenarioName,
      ...inputKeys.map((key) => (scenarioData.inputs[key] !== undefined ? scenarioData.inputs[key] : '')),
      ...outputKeys.map((key) => (scenarioData.outputs[key] !== undefined ? scenarioData.outputs[key] : '')),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    return csvContent;
  }
}
