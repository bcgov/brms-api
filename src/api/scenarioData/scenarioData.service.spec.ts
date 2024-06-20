import { Test, TestingModule } from '@nestjs/testing';
import { ScenarioDataService } from './scenarioData.service';
import { getModelToken } from '@nestjs/mongoose';
import { Types, Model } from 'mongoose';
import { ScenarioData, ScenarioDataDocument, Variable } from './scenarioData.schema';
import { DecisionsService } from '../decisions/decisions.service';
import { RuleMappingService } from '../ruleMapping/ruleMapping.service';
import { ConfigService } from '@nestjs/config';
import { DocumentsService } from '../documents/documents.service';
import * as csvParser from 'csv-parser';
import { Readable } from 'stream';

describe('ScenarioDataService', () => {
  let service: ScenarioDataService;
  let decisionsService: DecisionsService;
  let ruleMappingService: RuleMappingService;
  let model: Model<ScenarioDataDocument>;

  const testObjectId = new Types.ObjectId();

  const mockScenarioData: ScenarioData = {
    _id: testObjectId,
    title: 'Test Title',
    ruleID: 'ruleID',
    variables: [],
    goRulesJSONFilename: 'test.json',
  };

  class MockScenarioDataModel {
    constructor(private data: ScenarioData) {}
    save = jest.fn().mockResolvedValue(this.data);
    static find = jest.fn();
    static findOne = jest.fn();
    static findOneAndDelete = jest.fn();
  }

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
            get: jest.fn().mockReturnValue('mocked_value'), // Replace with your mocked config values
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
      MockScenarioDataModel.find = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(scenarioDataList) });

      const result = await service.getScenariosByFilename(goRulesJSONFilename);

      expect(result).toEqual(scenarioDataList);
      expect(MockScenarioDataModel.find).toHaveBeenCalledWith({ goRulesJSONFilename });
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

      expect(MockScenarioDataModel.find).toHaveBeenCalledWith({ goRulesJSONFilename });
    });
  });
  describe('runDecisionsForScenarios', () => {
    it('should run decisions for scenarios and map inputs/outputs correctly', async () => {
      const goRulesJSONFilename = 'test.json';
      const scenarios = [
        {
          _id: testObjectId,
          title: 'Scenario 1',
          variables: [{ name: 'familyComposition', value: 'single' }],
          ruleID: 'ruleID',
          goRulesJSONFilename: 'test.json',
        },
        {
          _id: testObjectId,
          title: 'Scenario 2',
          variables: [{ name: 'numberOfChildren', value: 2 }],
          ruleID: 'ruleID',
          goRulesJSONFilename: 'test.json',
        },
      ];
      const ruleSchema = {
        inputs: [
          { id: 'id1', name: 'Family Composition', property: 'familyComposition' },
          { id: 'id2', name: 'Number of Children', property: 'numberOfChildren' },
        ],
        finalOutputs: [
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
      jest.spyOn(ruleMappingService, 'ruleSchemaFile').mockResolvedValue(ruleSchema);
      jest.spyOn(decisionsService, 'runDecisionByFile').mockResolvedValue(decisionResult);

      const results = await service.runDecisionsForScenarios(goRulesJSONFilename);

      expect(results).toEqual({
        'Scenario 1': {
          inputs: { familyComposition: 'single', numberOfChildren: 2 },
          outputs: { baseAmount: 100, isEligible: true },
        },
        'Scenario 2': {
          inputs: { familyComposition: 'single', numberOfChildren: 2 },
          outputs: { baseAmount: 100, isEligible: true },
        },
      });
    });
    it('should handle errors in decision execution', async () => {
      const goRulesJSONFilename = 'test.json';
      const scenarios = [
        {
          _id: testObjectId,
          title: 'Scenario 1',
          variables: [{ name: 'familyComposition', value: 'single' }],
          ruleID: 'ruleID',
          goRulesJSONFilename: 'test.json',
        },
      ];
      const ruleSchema = {
        inputs: [{ id: 'id1', name: 'Family Composition', property: 'familyComposition' }],
        finalOutputs: [{ id: 'id3', name: 'Is Eligible', property: 'isEligible' }],
      };

      jest.spyOn(service, 'getScenariosByFilename').mockResolvedValue(scenarios);
      jest.spyOn(ruleMappingService, 'ruleSchemaFile').mockResolvedValue(ruleSchema);
      jest.spyOn(decisionsService, 'runDecisionByFile').mockRejectedValue(new Error('Decision execution error'));

      const results = await service.runDecisionsForScenarios(goRulesJSONFilename);
      expect(results).toEqual({
        [testObjectId.toString()]: { error: 'Decision execution error' },
      });
    });

    it('should handle scenarios with no variables', async () => {
      const goRulesJSONFilename = 'test.json';
      const scenarios = [
        {
          _id: testObjectId,
          title: 'Scenario 1',
          variables: [],
          ruleID: 'ruleID',
          goRulesJSONFilename: 'test.json',
        },
      ];
      const ruleSchema = {
        inputs: [],
        finalOutputs: [{ id: 'id3', name: 'Is Eligible', property: 'isEligible' }],
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
      jest.spyOn(ruleMappingService, 'ruleSchemaFile').mockResolvedValue(ruleSchema);
      jest.spyOn(decisionsService, 'runDecisionByFile').mockResolvedValue(decisionResult);

      const results = await service.runDecisionsForScenarios(goRulesJSONFilename);

      expect(results).toEqual({
        'Scenario 1': {
          inputs: {},
          outputs: { isEligible: true },
        },
      });
    });
  });

  describe('getCSVForRuleRun', () => {
    it('should generate a CSV with correct headers and data', async () => {
      const goRulesJSONFilename = 'test.json';
      const ruleRunResults = {
        'Scenario 1': {
          inputs: { familyComposition: 'single', numberOfChildren: 2 },
          outputs: { isEligible: true, baseAmount: 100 },
        },
        'Scenario 2': {
          inputs: { familyComposition: 'couple', numberOfChildren: 3 },
          outputs: { isEligible: false, baseAmount: 200 },
        },
      };

      jest.spyOn(service, 'runDecisionsForScenarios').mockResolvedValue(ruleRunResults);

      const csvContent = await service.getCSVForRuleRun(goRulesJSONFilename);

      const expectedCsvContent = `Scenario,Input: familyComposition,Input: numberOfChildren,Output: isEligible,Output: baseAmount\nScenario 1,single,2,true,100\nScenario 2,couple,3,false,200`;

      expect(csvContent.trim()).toBe(expectedCsvContent.trim());
    });

    it('should generate a CSV with missing inputs/outputs filled as empty strings', async () => {
      const goRulesJSONFilename = 'test.json';
      const ruleRunResults = {
        'Scenario 1': {
          inputs: { familyComposition: 'single' },
          outputs: { isEligible: true },
        },
        'Scenario 2': {
          inputs: { familyComposition: 'couple', numberOfChildren: 3 },
          outputs: { baseAmount: 200 },
        },
      };

      jest.spyOn(service, 'runDecisionsForScenarios').mockResolvedValue(ruleRunResults);

      const csvContent = await service.getCSVForRuleRun(goRulesJSONFilename);

      const expectedCsvContent = `Scenario,Input: familyComposition,Input: numberOfChildren,Output: isEligible,Output: baseAmount\nScenario 1,single,,true,\nScenario 2,couple,3,,200`;

      expect(csvContent.trim()).toBe(expectedCsvContent.trim());
    });

    it('should generate a CSV with only one scenario', async () => {
      const goRulesJSONFilename = 'test.json';
      const ruleRunResults = {
        'Scenario 1': {
          inputs: { familyComposition: 'single', numberOfChildren: 2 },
          outputs: { isEligible: true, baseAmount: 100 },
        },
      };

      jest.spyOn(service, 'runDecisionsForScenarios').mockResolvedValue(ruleRunResults);

      const csvContent = await service.getCSVForRuleRun(goRulesJSONFilename);

      const expectedCsvContent = `Scenario,Input: familyComposition,Input: numberOfChildren,Output: isEligible,Output: baseAmount\nScenario 1,single,2,true,100`;

      expect(csvContent.trim()).toBe(expectedCsvContent.trim());
    });

    it('should generate an empty CSV if no scenarios are present', async () => {
      const goRulesJSONFilename = 'test.json';
      const ruleRunResults = {};

      jest.spyOn(service, 'runDecisionsForScenarios').mockResolvedValue(ruleRunResults);

      const csvContent = await service.getCSVForRuleRun(goRulesJSONFilename);

      const expectedCsvContent = `Scenario`;

      expect(csvContent.trim()).toBe(expectedCsvContent.trim());
    });

    it('should handle scenarios with no variables or outputs', async () => {
      const goRulesJSONFilename = 'test.json';
      const ruleRunResults = {
        'Scenario 1': {
          inputs: {},
          outputs: {},
        },
      };

      jest.spyOn(service, 'runDecisionsForScenarios').mockResolvedValue(ruleRunResults);

      const csvContent = await service.getCSVForRuleRun(goRulesJSONFilename);

      const expectedCsvContent = `Scenario\nScenario 1`;

      expect(csvContent.trim()).toBe(expectedCsvContent.trim());
    });
  });

  describe('parseCSV', () => {
    it('should parse a CSV file and return the parsed data as a 2D array', async () => {
      const fileBuffer = Buffer.from('a,b,c\n1,2,3\n4,5,6\n');
      const file: Express.Multer.File = {
        buffer: fileBuffer,
        fieldname: '',
        originalname: '',
        encoding: '',
        mimetype: '',
        size: 0,
        stream: null,
        destination: '',
        filename: '',
        path: '',
      };

      const expectedOutput = [
        ['a', 'b', 'c'],
        ['1', '2', '3'],
        ['4', '5', '6'],
      ];

      const result = await service.parseCSV(file);
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('processProvidedScenarios', () => {
    it('should process CSV content and return scenario data', async () => {
      const csvContent = Buffer.from('Title,Input: Age,Input: Name\nScenario 1,25,John\nScenario 2,30,Jane');
      const file: Express.Multer.File = {
        buffer: csvContent,
        fieldname: '',
        originalname: '',
        encoding: '',
        mimetype: '',
        size: 0,
        stream: null,
        destination: '',
        filename: '',
        path: '',
      };

      const expectedScenarios: ScenarioData[] = [
        {
          _id: expect.any(Types.ObjectId),
          title: 'Scenario 1',
          ruleID: '',
          variables: [
            { name: 'Age', value: 25, type: 'number' },
            { name: 'Name', value: 'John', type: 'string' },
          ],
          goRulesJSONFilename: 'test.json',
        },
        {
          _id: expect.any(Types.ObjectId),
          title: 'Scenario 2',
          ruleID: '',
          variables: [
            { name: 'Age', value: 30, type: 'number' },
            { name: 'Name', value: 'Jane', type: 'string' },
          ],
          goRulesJSONFilename: 'test.json',
        },
      ];

      jest.spyOn(service, 'parseCSV').mockResolvedValue([
        ['Title', 'Input: Age', 'Input: Name'],
        ['Scenario 1', '25', 'John'],
        ['Scenario 2', '30', 'Jane'],
      ]);

      const result = await service.processProvidedScenarios('test.json', file);

      expect(result).toEqual(expectedScenarios);
    });

    it('should handle boolean values correctly', async () => {
      const csvContent = Buffer.from('Title,Input: Active\nScenario 1,True\nScenario 2,False');
      const file: Express.Multer.File = {
        buffer: csvContent,
        fieldname: '',
        originalname: '',
        encoding: '',
        mimetype: '',
        size: 0,
        stream: null,
        destination: '',
        filename: '',
        path: '',
      };

      const expectedScenarios: ScenarioData[] = [
        {
          _id: expect.any(Types.ObjectId),
          title: 'Scenario 1',
          ruleID: '',
          variables: [{ name: 'Active', value: true, type: 'boolean' }],
          goRulesJSONFilename: 'test.json',
        },
        {
          _id: expect.any(Types.ObjectId),
          title: 'Scenario 2',
          ruleID: '',
          variables: [{ name: 'Active', value: false, type: 'boolean' }],
          goRulesJSONFilename: 'test.json',
        },
      ];

      jest.spyOn(service, 'parseCSV').mockResolvedValue([
        ['Title', 'Input: Active'],
        ['Scenario 1', 'True'],
        ['Scenario 2', 'False'],
      ]);

      const result = await service.processProvidedScenarios('test.json', file);

      expect(result).toEqual(expectedScenarios);
    });

    it('should handle string values correctly', async () => {
      const csvContent = Buffer.from('Title,Input: Name\nScenario 1,John\nScenario 2,Jane');
      const file: Express.Multer.File = {
        buffer: csvContent,
        fieldname: '',
        originalname: '',
        encoding: '',
        mimetype: '',
        size: 0,
        stream: null,
        destination: '',
        filename: '',
        path: '',
      };

      const expectedScenarios: ScenarioData[] = [
        {
          _id: expect.any(Types.ObjectId),
          title: 'Scenario 1',
          ruleID: '',
          variables: [{ name: 'Name', value: 'John', type: 'string' }],
          goRulesJSONFilename: 'test.json',
        },
        {
          _id: expect.any(Types.ObjectId),
          title: 'Scenario 2',
          ruleID: '',
          variables: [{ name: 'Name', value: 'Jane', type: 'string' }],
          goRulesJSONFilename: 'test.json',
        },
      ];

      jest.spyOn(service, 'parseCSV').mockResolvedValue([
        ['Title', 'Input: Name'],
        ['Scenario 1', 'John'],
        ['Scenario 2', 'Jane'],
      ]);

      const result = await service.processProvidedScenarios('test.json', file);

      expect(result).toEqual(expectedScenarios);
    });

    it('should handle number values correctly', async () => {
      const csvContent = Buffer.from('Title,Input: Age\nScenario 1,25\nScenario 2,30');
      const file: Express.Multer.File = {
        buffer: csvContent,
        fieldname: '',
        originalname: '',
        encoding: '',
        mimetype: '',
        size: 0,
        stream: null,
        destination: '',
        filename: '',
        path: '',
      };

      const expectedScenarios: ScenarioData[] = [
        {
          _id: expect.any(Types.ObjectId),
          title: 'Scenario 1',
          ruleID: '',
          variables: [{ name: 'Age', value: 25, type: 'number' }],
          goRulesJSONFilename: 'test.json',
        },
        {
          _id: expect.any(Types.ObjectId),
          title: 'Scenario 2',
          ruleID: '',
          variables: [{ name: 'Age', value: 30, type: 'number' }],
          goRulesJSONFilename: 'test.json',
        },
      ];

      jest.spyOn(service, 'parseCSV').mockResolvedValue([
        ['Title', 'Input: Age'],
        ['Scenario 1', '25'],
        ['Scenario 2', '30'],
      ]);

      const result = await service.processProvidedScenarios('test.json', file);

      expect(result).toEqual(expectedScenarios);
    });

    it('should throw an error if CSV parsing fails', async () => {
      const csvContent = Buffer.from('Title,Input: Age\nScenario 1,25\nScenario 2,invalid data');
      const file: Express.Multer.File = {
        buffer: csvContent,
        fieldname: '',
        originalname: '',
        encoding: '',
        mimetype: '',
        size: 0,
        stream: null,
        destination: '',
        filename: '',
        path: '',
      };

      jest.spyOn(service, 'parseCSV').mockRejectedValue(new Error('Mocked CSV parsing error'));

      await expect(service.processProvidedScenarios('test.json', file)).rejects.toThrow('Mocked CSV parsing error');
    });
  });
});
