import { Test, TestingModule } from '@nestjs/testing';
import { ScenarioDataController } from './scenarioData.controller';
import { ScenarioDataService } from './scenarioData.service';
import { ScenarioData } from './scenarioData.schema';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Types } from 'mongoose';
import { Response } from 'express';

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
    getCSVForRuleRun: jest.fn(),
    processProvidedScenarios: jest.fn(),
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

  describe('getCSVForRuleRun', () => {
    it('should return CSV content with correct headers', async () => {
      const goRulesJSONFilename = 'test.json';
      const csvContent = `Scenario,Input: familyComposition,Input: numberOfChildren,Output: isEligible,Output: baseAmount
Scenario 1,single,,true,
Scenario 2,couple,3,,200`;

      jest.spyOn(service, 'getCSVForRuleRun').mockResolvedValue(csvContent);

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        setHeader: jest.fn(),
      };

      await controller.getCSVForRuleRun(goRulesJSONFilename, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        `attachment; filename=${goRulesJSONFilename.replace(/\.json$/, '.csv')}`,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(csvContent);
    });

    it('should throw an error if service fails', async () => {
      const errorMessage = 'Error generating CSV for rule run';
      const goRulesJSONFilename = 'test.json';
      jest.spyOn(service, 'getCSVForRuleRun').mockRejectedValue(new Error(errorMessage));

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await expect(async () => {
        await controller.getCSVForRuleRun(goRulesJSONFilename, mockResponse as any);
      }).rejects.toThrow(Error);

      try {
        await controller.getCSVForRuleRun(goRulesJSONFilename, mockResponse as any);
      } catch (error) {
        expect(error.message).toBe('Error generating CSV for rule run');
      }
    });
  });
  describe('uploadCSVAndProcess', () => {
    it('should throw an error if no file is uploaded', async () => {
      const res: Partial<Response> = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await expect(controller.uploadCSVAndProcess(undefined, res as Response, 'test.json')).rejects.toThrow(
        HttpException,
      );

      expect(res.status).not.toHaveBeenCalled();
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });

    it('should process the CSV and return processed data', async () => {
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

      const scenarios = [
        {
          _id: new Types.ObjectId(),
          title: 'Scenario 1',
          ruleID: '',
          variables: [{ name: 'Age', value: 25, type: 'number' }],
          goRulesJSONFilename: 'test.json',
        },
      ];

      const csvResult = 'Processed CSV Content';

      mockScenarioDataService.processProvidedScenarios.mockResolvedValue(scenarios);
      mockScenarioDataService.getCSVForRuleRun.mockResolvedValue(csvResult);

      const res: Partial<Response> = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await controller.uploadCSVAndProcess(file, res as Response, 'test.json');

      expect(service.processProvidedScenarios).toHaveBeenCalledWith('test.json', file);
      expect(service.getCSVForRuleRun).toHaveBeenCalledWith('test.json', scenarios);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=processed_data.csv');
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.send).toHaveBeenCalledWith(csvResult);
    });

    it('should handle errors during processing', async () => {
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

      mockScenarioDataService.processProvidedScenarios.mockRejectedValue(new Error('Mocked error'));

      const res: Partial<Response> = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await expect(controller.uploadCSVAndProcess(file, res as Response, 'test.json')).rejects.toThrow(
        new HttpException('Error processing CSV file', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(service.processProvidedScenarios).toHaveBeenCalledWith('test.json', file);
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.send).not.toHaveBeenCalled();
    });
  });
});
