import { Test, TestingModule } from '@nestjs/testing';
import { ScenarioDataService } from './scenarioData.service';
import { getModelToken } from '@nestjs/mongoose';
import { Types, Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { ScenarioData, ScenarioDataDocument } from './scenarioData.schema';
import { RuleSchema } from './scenarioData.interface';
import { DecisionsService } from '../decisions/decisions.service';
import { RuleMappingService } from '../ruleMapping/ruleMapping.service';
import { DocumentsService } from '../documents/documents.service';
import { parseCSV } from '../../utils/csv';

jest.mock('../../utils/csv');

describe('ScenarioDataService', () => {
  let service: ScenarioDataService;
  let decisionsService: DecisionsService;
  let ruleMappingService: RuleMappingService;
  let model: Model<ScenarioDataDocument>;

  const testObjectId = new Types.ObjectId();

  const mockScenarioData: ScenarioData = {
    title: 'Test Title',
    ruleID: 'ruleID',
    variables: [],
    goRulesJSONFilename: 'test.json',
    expectedResults: [],
  };

  class MockScenarioDataModel {
    constructor(private data: ScenarioData) {}
    save = jest.fn().mockResolvedValue(this.data);
    static find = jest.fn();
    static findOne = jest.fn();
    static findOneAndDelete = jest.fn();
  }

  let originalConsoleError: {
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
  };

  beforeAll(() => {
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecisionsService,
        RuleMappingService,
        ScenarioDataService,
        {
          provide: getModelToken(ScenarioData.name),
          useValue: MockScenarioDataModel,
        },
        DocumentsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mocked_value'),
          },
        },
      ],
    }).compile();

    service = module.get<ScenarioDataService>(ScenarioDataService);
    decisionsService = module.get<DecisionsService>(DecisionsService);
    ruleMappingService = module.get<RuleMappingService>(RuleMappingService);
    model = module.get<Model<ScenarioDataDocument>>(getModelToken(ScenarioData.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllScenarioData', () => {
    it('should return all scenario data', async () => {
      const scenarioDataList: ScenarioData[] = [mockScenarioData];
      MockScenarioDataModel.find = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(scenarioDataList) });

      const result = await service.getAllScenarioData();

      expect(result).toEqual(scenarioDataList);
      expect(MockScenarioDataModel.find).toHaveBeenCalled();
    });

    it('should throw an error if an error occurs while retrieving scenario data', async () => {
      const errorMessage = 'DB Error';
      MockScenarioDataModel.find = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockRejectedValue(new Error(errorMessage)) });

      await expect(async () => {
        await service.getAllScenarioData();
      }).rejects.toThrowError(`Error getting all scenario data: ${errorMessage}`);

      expect(MockScenarioDataModel.find).toHaveBeenCalled();
    });
  });

  describe('getScenarioData', () => {
    it('should return scenario data by id', async () => {
      const scenarioId = testObjectId.toString();
      const scenarioData: ScenarioData = mockScenarioData;
      MockScenarioDataModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(scenarioData) });

      const result = await service.getScenarioData(scenarioId);

      expect(result).toEqual(scenarioData);
      expect(MockScenarioDataModel.findOne).toHaveBeenCalledWith({ _id: scenarioId });
    });

    it('should throw an error if scenario data is not found', async () => {
      const scenarioId = testObjectId.toString();
      MockScenarioDataModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(async () => {
        await service.getScenarioData(scenarioId);
      }).rejects.toThrowError('Scenario data not found');

      expect(MockScenarioDataModel.findOne).toHaveBeenCalledWith({ _id: scenarioId });
    });

    it('should throw an error if an error occurs while retrieving scenario data', async () => {
      const scenarioId = testObjectId.toString();
      const errorMessage = 'DB Error';
      MockScenarioDataModel.findOne = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockRejectedValue(new Error(errorMessage)) });

      await expect(async () => {
        await service.getScenarioData(scenarioId);
      }).rejects.toThrowError(`Error getting scenario data: ${errorMessage}`);

      expect(MockScenarioDataModel.findOne).toHaveBeenCalledWith({ _id: scenarioId });
    });
  });

  describe('createScenarioData', () => {
    it('should create scenario data', async () => {
      const scenarioData: ScenarioData = mockScenarioData;
      const modelInstance = new model(scenarioData);
      modelInstance.save = jest.fn().mockResolvedValue(scenarioData);
      const result = await service.createScenarioData(scenarioData);
      expect(result).toEqual(scenarioData);
    });
  });

  describe('updateScenarioData', () => {
    it('should update scenario data', async () => {
      const scenarioId = testObjectId.toString();
      const updatedData: Partial<ScenarioData> = { title: 'Updated Title' };
      const existingScenarioData = new model(mockScenarioData);
      existingScenarioData.save = jest.fn().mockResolvedValue({ ...mockScenarioData, ...updatedData });

      MockScenarioDataModel.findOne = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(existingScenarioData) });

      const result = await service.updateScenarioData(scenarioId, updatedData);

      expect(result).toEqual({ ...mockScenarioData, ...updatedData });
      expect(MockScenarioDataModel.findOne).toHaveBeenCalledWith({ _id: scenarioId });
      expect(existingScenarioData.save).toHaveBeenCalled();
    });

    it('should throw an error if scenario data is not found', async () => {
      const scenarioId = testObjectId.toString();
      const updatedData: Partial<ScenarioData> = { title: 'Updated Title' };

      MockScenarioDataModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(async () => {
        await service.updateScenarioData(scenarioId, updatedData);
      }).rejects.toThrowError('Scenario data not found');

      expect(MockScenarioDataModel.findOne).toHaveBeenCalledWith({ _id: scenarioId });
    });

    it('should throw an error if an error occurs while updating scenario data', async () => {
      const scenarioId = testObjectId.toString();
      const updatedData: Partial<ScenarioData> = { title: 'Updated Title' };
      const errorMessage = 'DB Error';

      MockScenarioDataModel.findOne = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockRejectedValue(new Error(errorMessage)) });

      await expect(async () => {
        await service.updateScenarioData(scenarioId, updatedData);
      }).rejects.toThrowError(`Failed to update scenario data: ${errorMessage}`);

      expect(MockScenarioDataModel.findOne).toHaveBeenCalledWith({ _id: scenarioId });
    });
  });

  describe('deleteScenarioData', () => {
    it('should delete scenario data successfully', async () => {
      const scenarioId = testObjectId.toString();
      const objectId = new Types.ObjectId(scenarioId);
      MockScenarioDataModel.findOneAndDelete = jest.fn().mockResolvedValue({ _id: objectId });
      await expect(service.deleteScenarioData(scenarioId)).resolves.toBeUndefined();

      expect(MockScenarioDataModel.findOneAndDelete).toHaveBeenCalledWith({ _id: objectId });
    });

    it('should throw an error if scenario data is not found', async () => {
      const scenarioId = testObjectId.toString();
      const objectId = new Types.ObjectId(scenarioId);

      MockScenarioDataModel.findOneAndDelete = jest.fn().mockResolvedValue(null);

      await expect(service.deleteScenarioData(scenarioId)).rejects.toThrowError('Scenario data not found');

      expect(MockScenarioDataModel.findOneAndDelete).toHaveBeenCalledWith({ _id: objectId });
    });

    it('should throw an error if an error occurs while deleting scenario data', async () => {
      const scenarioId = testObjectId.toString();
      const objectId = new Types.ObjectId(scenarioId);
      const errorMessage = 'DB Error';
      MockScenarioDataModel.findOneAndDelete = jest.fn().mockRejectedValue(new Error(errorMessage));
      await expect(service.deleteScenarioData(scenarioId)).rejects.toThrowError(
        `Failed to delete scenario data: ${errorMessage}`,
      );
      expect(MockScenarioDataModel.findOneAndDelete).toHaveBeenCalledWith({ _id: objectId });
    });
  });

  describe('getScenariosByRuleId', () => {
    it('should return scenarios by rule ID', async () => {
      const ruleId = testObjectId.toString();
      const scenarioDataList: ScenarioData[] = [mockScenarioData];
      MockScenarioDataModel.find = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(scenarioDataList) });

      const result = await service.getScenariosByRuleId(ruleId);

      expect(result).toEqual(scenarioDataList);
      expect(MockScenarioDataModel.find).toHaveBeenCalledWith({ ruleID: ruleId });
    });

    it('should throw an error if an error occurs while retrieving scenarios by rule ID', async () => {
      const ruleId = testObjectId.toString();
      const errorMessage = 'DB Error';

      MockScenarioDataModel.find = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockRejectedValue(new Error(errorMessage)) });

      await expect(async () => {
        await service.getScenariosByRuleId(ruleId);
      }).rejects.toThrowError(`Error getting scenarios by rule ID: ${errorMessage}`);

      expect(MockScenarioDataModel.find).toHaveBeenCalledWith({ ruleID: ruleId });
    });
  });

  describe('getScenariosByFilename', () => {
    it('should return scenarios by filename', async () => {
      const goRulesJSONFilename = 'test.json';
      const scenarioDataList: ScenarioData[] = [mockScenarioData];
      scenarioDataList[0].goRulesJSONFilename = goRulesJSONFilename;
      MockScenarioDataModel.find = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(scenarioDataList) });

      const result = await service.getScenariosByFilename(goRulesJSONFilename);

      expect(result).toEqual(scenarioDataList);
      expect(MockScenarioDataModel.find).toHaveBeenCalledWith({ goRulesJSONFilename: { $eq: goRulesJSONFilename } });
    });

    it('should throw an error if an error occurs while retrieving scenarios by filename', async () => {
      const goRulesJSONFilename = 'test.json';
      const errorMessage = 'DB Error';

      MockScenarioDataModel.find = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockRejectedValue(new Error(errorMessage)) });

      await expect(async () => {
        await service.getScenariosByFilename(goRulesJSONFilename);
      }).rejects.toThrowError(`Error getting scenarios by filename: ${errorMessage}`);

      expect(MockScenarioDataModel.find).toHaveBeenCalledWith({ goRulesJSONFilename: { $eq: goRulesJSONFilename } });
    });
  });
  describe('runDecisionsForScenarios', () => {
    it('should run decisions for scenarios and map inputs/outputs correctly', async () => {
      const goRulesJSONFilename = 'test.json';
      const ruleContent = {
        nodes: [
          {
            id: 'node1',
            type: 'inputNode',
            content: {
              fields: [
                { id: 'id1', name: 'Family Composition', field: 'familyComposition', dataType: 'string' },
                { id: 'id2', name: 'Number of Children', field: 'numberOfChildren', dataType: 'number' },
              ],
            },
          },
          {
            id: 'node2',
            type: 'outputNode',
            content: {
              fields: [
                { id: 'id3', name: 'Is Eligible', field: 'isEligible', dataType: 'boolean' },
                { id: 'id4', name: 'Base Amount', field: 'baseAmount', dataType: 'number' },
              ],
            },
          },
        ],
        edges: [],
      };
      const scenarios = [
        {
          _id: testObjectId,
          title: 'Scenario 1',
          variables: [{ name: 'familyComposition', value: 'single' }],
          ruleID: 'ruleID',
          goRulesJSONFilename: 'test.json',
          expectedResults: [],
        },
        {
          _id: testObjectId,
          title: 'Scenario 2',
          variables: [{ name: 'numberOfChildren', value: 2 }],
          ruleID: 'ruleID',
          goRulesJSONFilename: 'test.json',
          expectedResults: [],
        },
      ];
      const ruleSchemaOutput: RuleSchema = {
        inputs: [
          { id: 'id1', name: 'Family Composition', property: 'familyComposition' },
          { id: 'id2', name: 'Number of Children', property: 'numberOfChildren' },
        ],
        outputs: [],
        resultOutputs: [
          { id: 'id3', name: 'Is Eligible', property: 'isEligible' },
          { id: 'id4', name: 'Base Amount', property: 'baseAmount' },
        ],
      };
      const decisionResult = {
        performance: '0.7',
        result: { status: 'pass' },
        trace: {
          trace1: {
            id: 'trace1',
            name: 'trace1',
            input: { familyComposition: 'single' },
            output: { isEligible: true },
          },
          trace2: {
            id: 'trace2',
            name: 'trace2',
            input: { numberOfChildren: 2 },
            output: { baseAmount: 100 },
            performance: '0.7',
          },
        },
      };

      jest.spyOn(service, 'getScenariosByFilename').mockResolvedValue(scenarios);
      jest.spyOn(ruleMappingService, 'ruleSchema').mockResolvedValue(ruleSchemaOutput);
      jest.spyOn(decisionsService, 'runDecisionByContent').mockResolvedValue(decisionResult);

      const results = await service.runDecisionsForScenarios(goRulesJSONFilename, ruleContent);

      expect(results).toEqual({
        'Scenario 1': {
          inputs: { familyComposition: 'single', numberOfChildren: 2 },
          outputs: { baseAmount: 100, isEligible: true },
          result: {
            status: 'pass',
          },
          expectedResults: {},
          resultMatch: true,
        },
        'Scenario 2': {
          inputs: { familyComposition: 'single', numberOfChildren: 2 },
          outputs: { baseAmount: 100, isEligible: true },
          result: {
            status: 'pass',
          },
          expectedResults: {},
          resultMatch: true,
        },
      });
    });
    it('should handle errors in decision execution', async () => {
      const goRulesJSONFilename = 'test.json';
      const ruleContent = { nodes: [], edges: [] };
      const scenarios = [
        {
          _id: testObjectId,
          title: 'Scenario 1',
          variables: [{ name: 'familyComposition', value: 'single' }],
          ruleID: 'ruleID',
          goRulesJSONFilename: 'test.json',
          expectedResults: [],
        },
      ];
      const ruleSchema = {
        inputs: [{ id: 'id1', name: 'Family Composition', property: 'familyComposition' }],
        outputs: [],
        resultOutputs: [{ id: 'id3', name: 'Is Eligible', property: 'isEligible' }],
      };

      jest.spyOn(service, 'getScenariosByFilename').mockResolvedValue(scenarios);
      jest.spyOn(ruleMappingService, 'ruleSchema').mockResolvedValue(ruleSchema);
      jest.spyOn(decisionsService, 'runDecisionByContent').mockRejectedValue(new Error('Decision execution error'));

      const results = await service.runDecisionsForScenarios(goRulesJSONFilename, ruleContent);
      expect(results).toEqual({
        [testObjectId.toString()]: { error: 'Decision execution error' },
      });
    });

    it('should handle scenarios with no variables', async () => {
      const goRulesJSONFilename = 'test.json';
      const ruleContent = { nodes: [], edges: [] };
      const scenarios = [
        {
          _id: testObjectId,
          title: 'Scenario 1',
          variables: [],
          ruleID: 'ruleID',
          goRulesJSONFilename: 'test.json',
          expectedResults: [],
        },
      ];
      const ruleSchema: RuleSchema = {
        inputs: [],
        outputs: [],
        resultOutputs: [{ id: 'id3', name: 'Is Eligible', property: 'isEligible' }],
      };
      const decisionResult = {
        performance: '0.7',
        result: { status: 'pass' },
        trace: {
          trace1: {
            id: 'trace1',
            name: 'trace1',
            input: {},
            output: { isEligible: true },
          },
        },
      };

      jest.spyOn(service, 'getScenariosByFilename').mockResolvedValue(scenarios);
      jest.spyOn(ruleMappingService, 'ruleSchema').mockResolvedValue(ruleSchema);
      jest.spyOn(decisionsService, 'runDecisionByContent').mockResolvedValue(decisionResult);

      const results = await service.runDecisionsForScenarios(goRulesJSONFilename, ruleContent);

      expect(results).toEqual({
        'Scenario 1': {
          inputs: {},
          outputs: {},
          expectedResults: {},
          result: {
            status: 'pass',
          },
          resultMatch: true,
        },
      });
    });
  });

  describe('getCSVForRuleRun', () => {
    it('should generate a CSV with correct headers and data', async () => {
      const goRulesJSONFilename = 'test.json';
      const ruleContent = { nodes: [], edges: [] };
      const ruleRunResults = {
        'Scenario 1': {
          inputs: { familyComposition: 'single', numberOfChildren: 2 },
          outputs: { isEligible: true, baseAmount: 100 },
          expectedResults: {},
          resultMatch: false,
        },
        'Scenario 2': {
          inputs: { familyComposition: 'couple', numberOfChildren: 3 },
          outputs: { isEligible: false, baseAmount: 200 },
          expectedResults: {},
          resultMatch: false,
        },
      };

      jest.spyOn(service, 'runDecisionsForScenarios').mockResolvedValue(ruleRunResults);

      const csvContent = await service.getCSVForRuleRun(goRulesJSONFilename, ruleContent);

      const expectedCsvContent = `Scenario,Results Match Expected (Pass/Fail),Input: familyComposition,Input: numberOfChildren\nScenario 1,Fail,single,2\nScenario 2,Fail,couple,3`;

      expect(csvContent.trim()).toBe(expectedCsvContent.trim());
    });

    it('should generate a CSV with missing inputs/outputs filled as empty strings', async () => {
      const goRulesJSONFilename = 'test.json';
      const ruleContent = { nodes: [], edges: [] };
      const ruleRunResults = {
        'Scenario 1': {
          inputs: { familyComposition: 'single' },
          outputs: { isEligible: true },
          expectedResults: {},
        },
        'Scenario 2': {
          inputs: { familyComposition: 'couple', numberOfChildren: 3 },
          outputs: { baseAmount: 200 },
          expectedResults: {},
        },
      };

      jest.spyOn(service, 'runDecisionsForScenarios').mockResolvedValue(ruleRunResults);

      const csvContent = await service.getCSVForRuleRun(goRulesJSONFilename, ruleContent);

      const expectedCsvContent = `Scenario,Results Match Expected (Pass/Fail),Input: familyComposition,Input: numberOfChildren\nScenario 1,Fail,single,\nScenario 2,Fail,couple,3`;

      expect(csvContent.trim()).toBe(expectedCsvContent.trim());
    });

    it('should generate a CSV with only one scenario', async () => {
      const goRulesJSONFilename = 'test.json';
      const ruleContent = { nodes: [], edges: [] };
      const ruleRunResults = {
        'Scenario 1': {
          inputs: { familyComposition: 'single', numberOfChildren: 2 },
          outputs: { isEligible: true, baseAmount: 100 },
          expectedResults: {},
        },
      };

      jest.spyOn(service, 'runDecisionsForScenarios').mockResolvedValue(ruleRunResults);

      const csvContent = await service.getCSVForRuleRun(goRulesJSONFilename, ruleContent);

      const expectedCsvContent = `Scenario,Results Match Expected (Pass/Fail),Input: familyComposition,Input: numberOfChildren\nScenario 1,Fail,single,2`;

      expect(csvContent.trim()).toBe(expectedCsvContent.trim());
    });

    it('should generate an empty CSV if no scenarios are present', async () => {
      const goRulesJSONFilename = 'test.json';
      const ruleContent = { nodes: [], edges: [] };
      const ruleRunResults = {};

      jest.spyOn(service, 'runDecisionsForScenarios').mockResolvedValue(ruleRunResults);

      const csvContent = await service.getCSVForRuleRun(goRulesJSONFilename, ruleContent);

      const expectedCsvContent = `Scenario,Results Match Expected (Pass/Fail)`;

      expect(csvContent.trim()).toBe(expectedCsvContent.trim());
    });

    it('should handle scenarios with no variables or outputs', async () => {
      const goRulesJSONFilename = 'test.json';
      const ruleContent = { nodes: [], edges: [] };
      const ruleRunResults = {
        'Scenario 1': {
          inputs: {},
          outputs: {},
        },
      };

      jest.spyOn(service, 'runDecisionsForScenarios').mockResolvedValue(ruleRunResults);

      const csvContent = await service.getCSVForRuleRun(goRulesJSONFilename, ruleContent);

      const expectedCsvContent = `Scenario,Results Match Expected (Pass/Fail)\nScenario 1,Fail`;

      expect(csvContent.trim()).toBe(expectedCsvContent.trim());
    });

    it('should escape inputs and outputs containing commas or quotes', async () => {
      const goRulesJSONFilename = 'test.json';
      const ruleContent = { nodes: [], edges: [] };
      const ruleRunResults = {
        'Scenario 1': {
          inputs: { input1: 'value, with, commas', input2: 'value "with" quotes' },
          outputs: { output1: 'result, with, commas', output2: 'result "with" quotes' },
          expectedResults: {},
        },
      };

      jest.spyOn(service, 'runDecisionsForScenarios').mockResolvedValue(ruleRunResults);

      const csvContent = await service.getCSVForRuleRun(goRulesJSONFilename, ruleContent);

      const expectedCsvContent = `Scenario,Results Match Expected (Pass/Fail),Input: input1,Input: input2\nScenario 1,Fail,"value, with, commas",value "with" quotes`;

      expect(csvContent.trim()).toBe(expectedCsvContent.trim());
    });
  });

  describe('processProvidedScenarios', () => {
    it('should process CSV content and return ScenarioData array', async () => {
      const mockCSVContent = {
        buffer: Buffer.from(
          'Title,Input: Age,Input: Income,Expected Result: Eligible\nScenario 1,30,50000,true\nScenario 2,25,30000,false',
        ),
      } as Express.Multer.File;

      const mockParsedData = [
        ['Title', 'Input: Age', 'Input: Income', 'Expected Result: Eligible'],
        ['Scenario 1', '30', '50000', 'true'],
        ['Scenario 2', '25', '30000', 'false'],
      ];

      (parseCSV as jest.Mock).mockResolvedValue(mockParsedData);

      const result = await service.processProvidedScenarios('test.json', mockCSVContent);

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        title: 'Scenario 1',
        ruleID: '',
        goRulesJSONFilename: 'test.json',
      });
      expect(result[1]).toMatchObject({
        title: 'Scenario 2',
        ruleID: '',
        goRulesJSONFilename: 'test.json',
      });

      expect(result[0]).toHaveProperty('variables');
      expect(result[0]).toHaveProperty('expectedResults');
      expect(result[1]).toHaveProperty('variables');
      expect(result[1]).toHaveProperty('expectedResults');

      if (result[0].variables) {
        expect(result[0].variables).toEqual({
          Age: '30',
          Income: '50000',
        });
      }
      if (result[0].expectedResults) {
        expect(result[0].expectedResults).toEqual({
          Eligible: true,
        });
      }
    });

    it('should throw an error if CSV content is empty', async () => {
      const mockCSVContent = {
        buffer: Buffer.from(''),
      } as Express.Multer.File;

      (parseCSV as jest.Mock).mockResolvedValue([]);

      await expect(service.processProvidedScenarios('test.json', mockCSVContent)).rejects.toThrow(
        'CSV content is empty or invalid',
      );
    });

    it('should handle CSV with only headers', async () => {
      const mockCSVContent = {
        buffer: Buffer.from('Title,Input: Age,Input: Income,Expected Result: Eligible'),
      } as Express.Multer.File;

      const mockParsedData = [['Title', 'Input: Age', 'Input: Income', 'Expected Result: Eligible']];

      (parseCSV as jest.Mock).mockResolvedValue(mockParsedData);

      const result = await service.processProvidedScenarios('test.json', mockCSVContent);

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });
  });
});
