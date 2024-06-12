import { Test, TestingModule } from '@nestjs/testing';
import { ScenarioDataController } from './scenarioData.controller';
import { ScenarioDataService } from './scenarioData.service';
import { ScenarioData } from './scenarioData.schema';
import { HttpException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('ScenarioDataController', () => {
  let controller: ScenarioDataController;
  let service: ScenarioDataService;

  const testObjectId = new Types.ObjectId();

  const mockScenarioDataService = {
    getAllScenarioData: jest.fn(),
    getScenariosByRuleId: jest.fn(),
    getScenariosByFilename: jest.fn(),
    getScenarioData: jest.fn(),
    createScenarioData: jest.fn(),
    updateScenarioData: jest.fn(),
    deleteScenarioData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScenarioDataController],
      providers: [
        {
          provide: ScenarioDataService,
          useValue: mockScenarioDataService,
        },
      ],
    }).compile();

    controller = module.get<ScenarioDataController>(ScenarioDataController);
    service = module.get<ScenarioDataService>(ScenarioDataService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllScenarioData', () => {
    it('should return an array of scenarios', async () => {
      const result: ScenarioData[] = [];
      jest.spyOn(service, 'getAllScenarioData').mockResolvedValue(result);

      expect(await controller.getAllScenarioData()).toBe(result);
    });

    it('should throw an error if service fails', async () => {
      jest.spyOn(service, 'getAllScenarioData').mockRejectedValue(new Error('Service error'));

      await expect(controller.getAllScenarioData()).rejects.toThrow(HttpException);
    });
  });

  describe('getScenariosByRuleId', () => {
    it('should return scenarios by rule ID', async () => {
      const result: ScenarioData[] = [];
      jest.spyOn(service, 'getScenariosByRuleId').mockResolvedValue(result);

      expect(await controller.getScenariosByRuleId('someRuleId')).toBe(result);
    });

    it('should throw an error if service fails', async () => {
      jest.spyOn(service, 'getScenariosByRuleId').mockRejectedValue(new Error('Service error'));

      await expect(controller.getScenariosByRuleId('someRuleId')).rejects.toThrow(HttpException);
    });
  });

  describe('getScenariosByFilename', () => {
    it('should return scenarios by filename', async () => {
      const result: ScenarioData[] = [];
      jest.spyOn(service, 'getScenariosByFilename').mockResolvedValue(result);

      expect(await controller.getScenariosByFilename('someFilename')).toBe(result);
    });

    it('should throw an error if service fails', async () => {
      jest.spyOn(service, 'getScenariosByFilename').mockRejectedValue(new Error('Service error'));

      await expect(controller.getScenariosByFilename('someFilename')).rejects.toThrow(HttpException);
    });
  });

  describe('getScenariosByRuleId', () => {
    it('should return scenarios by rule ID', async () => {
      const result: ScenarioData[] = [];
      jest.spyOn(service, 'getScenariosByRuleId').mockResolvedValue(result);

      expect(await controller.getScenariosByRuleId('ruleID')).toBe(result);
    });

    it('should throw an error if service fails', async () => {
      jest.spyOn(service, 'getScenariosByRuleId').mockRejectedValue(new Error('Service error'));

      await expect(controller.getScenariosByRuleId('ruleID')).rejects.toThrow(HttpException);
    });
  });

  describe('createScenarioData', () => {
    it('should create a scenario', async () => {
      const result: ScenarioData = {
        _id: testObjectId,
        title: 'title',
        ruleID: 'ruleID',
        variables: [],
        goRulesJSONFilename: 'filename',
      };
      jest.spyOn(service, 'createScenarioData').mockResolvedValue(result);

      expect(await controller.createScenarioData(result)).toBe(result);
    });

    it('should throw an error if service fails', async () => {
      jest.spyOn(service, 'createScenarioData').mockRejectedValue(new Error('Service error'));

      await expect(
        controller.createScenarioData({
          _id: testObjectId,
          title: 'title',
          ruleID: 'ruleID',
          variables: [],
          goRulesJSONFilename: 'filename',
        }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('updateScenarioData', () => {
    it('should update a scenario', async () => {
      const result: ScenarioData = {
        _id: testObjectId,
        title: 'title',
        ruleID: 'rule1',
        variables: [],
        goRulesJSONFilename: 'filename',
      };
      jest.spyOn(service, 'updateScenarioData').mockResolvedValue(result);

      expect(await controller.updateScenarioData(testObjectId.toHexString(), result)).toBe(result);
    });

    it('should throw an error if service fails', async () => {
      jest.spyOn(service, 'updateScenarioData').mockRejectedValue(new Error('Service error'));

      await expect(
        controller.updateScenarioData(testObjectId.toHexString(), {
          _id: testObjectId,
          title: 'title',
          ruleID: 'rule1',
          variables: [],
          goRulesJSONFilename: 'filename',
        }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('deleteScenarioData', () => {
    it('should delete a scenario', async () => {
      jest.spyOn(service, 'deleteScenarioData').mockResolvedValue(undefined);

      await expect(controller.deleteScenarioData(testObjectId.toHexString())).resolves.toBeUndefined();
    });

    it('should throw an error if service fails', async () => {
      jest.spyOn(service, 'deleteScenarioData').mockRejectedValue(new Error('Service error'));

      await expect(controller.deleteScenarioData(testObjectId.toHexString())).rejects.toThrow(HttpException);
    });
  });
});
