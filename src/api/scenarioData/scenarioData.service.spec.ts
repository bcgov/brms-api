import { Test, TestingModule } from '@nestjs/testing';
import { ScenarioDataService } from './scenarioData.service';
import { getModelToken } from '@nestjs/mongoose';
import { Types, Model } from 'mongoose';
import { ScenarioData, ScenarioDataDocument } from './scenarioData.schema';
import { DecisionsService } from '../decisions/decisions.service';
import { RuleMappingService } from '../ruleMapping/ruleMapping.service';
import { ConfigService } from '@nestjs/config';
import { DocumentsService } from '../documents/documents.service';

describe('ScenarioDataService', () => {
  let service: ScenarioDataService;
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
});
