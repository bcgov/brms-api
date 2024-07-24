import { Test, TestingModule } from '@nestjs/testing';
import { RuleMappingController } from './ruleMapping.controller';
import { RuleMappingService } from './ruleMapping.service';
import { EvaluateRuleMappingDto, EvaluateRuleRunSchemaDto } from './dto/evaluate-rulemapping.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { TraceObject } from './ruleMapping.interface';
import { ConfigService } from '@nestjs/config';

describe('RuleMappingController', () => {
  let controller: RuleMappingController;
  let service: RuleMappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RuleMappingController],
      providers: [
        RuleMappingService, // Actual service if needed for testing interactions
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mocked_value'),
          },
        },
        {
          provide: RuleMappingService,
          useValue: {
            ruleSchema: jest.fn(),
            evaluateRuleSchema: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RuleMappingController>(RuleMappingController);
    service = module.get<RuleMappingService>(RuleMappingService);
  });

  describe('getRuleSchema', () => {
    it('should return the rule schema with the correct headers', async () => {
      const ruleFileName = 'test-rule.json';
      const ruleContent = { nodes: [], edges: [] };
      const rulemap = { inputs: [], outputs: [], resultOutputs: [] };
      jest.spyOn(service, 'ruleSchema').mockResolvedValue(rulemap);

      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.getRuleSchema(ruleFileName, ruleContent, mockResponse);

      expect(service.ruleSchema).toHaveBeenCalledWith(ruleContent);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        `attachment; filename=${ruleFileName}`,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(rulemap);
    });
  });

  describe('evaluateRuleMap', () => {
    it('should return the evaluated rule map', async () => {
      const nodes = [{ id: '1', type: 'someType', content: { inputs: [], outputs: [] } }];
      const edges = [{ id: '2', type: 'someType', targetId: '1', sourceId: '1' }];
      const result = { inputs: [], outputs: [], resultOutputs: [] };
      jest.spyOn(service, 'ruleSchema').mockResolvedValue(result);

      const dto: EvaluateRuleMappingDto = { nodes, edges };
      const response = await controller.evaluateRuleMap(dto);

      expect(service.ruleSchema).toHaveBeenCalledWith({ nodes, edges });
      expect(response).toEqual({ result });
    });

    it('should handle errors properly', async () => {
      const nodes = [{ id: '1', type: 'someType', content: { inputs: [], outputs: [] } }];
      const edges = [{ id: '2', type: 'someType', targetId: '1', sourceId: '1' }];
      const error = new Error('Unexpected error');
      jest.spyOn(service, 'ruleSchema').mockImplementation(() => {
        throw error;
      });

      const dto: EvaluateRuleMappingDto = { nodes, edges };

      await expect(controller.evaluateRuleMap(dto)).rejects.toThrow(
        new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('evaluateRuleSchema', () => {
    it('should generate a rule schema correctly', async () => {
      const mockTraceObject: TraceObject = {
        '1': {
          id: '1',
          name: 'Test Rule',
          input: { field1: 'value1', field2: 'value2' },
          output: { outputField1: 'outputValue1' },
        },
      };
      const dto: EvaluateRuleRunSchemaDto = { trace: mockTraceObject };
      const mockEvaluateRuleSchemaResult = {
        input: { field1: 'value1', field2: 'value2' },
        output: { outputField1: 'outputValue1' },
      };

      jest.spyOn(service, 'evaluateRuleSchema').mockReturnValue(mockEvaluateRuleSchemaResult);

      const result = await controller.evaluateRuleSchema(dto);

      expect(service.evaluateRuleSchema).toHaveBeenCalledWith(mockTraceObject);
      expect(result).toEqual({ result: mockEvaluateRuleSchemaResult });
    });

    it('should generate a rule schema correctly with multiple nested objects', async () => {
      const mockTraceObject: TraceObject = {
        '1': {
          id: '1',
          name: 'Test Rule 1',
          input: { field1: 'value1', field2: 'value2' },
          output: { outputField1: 'outputValue1' },
        },
        '2': {
          id: '2',
          name: 'Test Rule 2',
          input: { field3: 'value3', field4: 'value4' },
          output: { outputField2: 'outputValue2' },
        },
        '3': {
          id: '3',
          name: 'Test Rule 3',
          input: { field5: 'value5' },
          output: { outputField3: 'outputValue3' },
        },
      };
      const dto: EvaluateRuleRunSchemaDto = { trace: mockTraceObject };
      const mockEvaluateRuleSchemaResult = {
        input: { field1: 'value1', field2: 'value2', field3: 'value3', field4: 'value4', field5: 'value5' },
        output: { outputField1: 'outputValue1', outputField2: 'outputValue2', outputField3: 'outputValue3' },
      };

      jest.spyOn(service, 'evaluateRuleSchema').mockReturnValue(mockEvaluateRuleSchemaResult);

      const result = await controller.evaluateRuleSchema(dto);

      expect(service.evaluateRuleSchema).toHaveBeenCalledWith(mockTraceObject);
      expect(result).toEqual({ result: mockEvaluateRuleSchemaResult });
    });

    it('should handle invalid data properly', async () => {
      const dto: EvaluateRuleRunSchemaDto = { trace: null };

      await expect(controller.evaluateRuleSchema(dto)).rejects.toThrow(
        new HttpException('Invalid request data', HttpStatus.BAD_REQUEST),
      );
    });

    it('should handle internal server errors properly', async () => {
      const mockTraceObject: TraceObject = {
        '1': {
          id: '1',
          name: 'Test Rule',
          input: { field1: 'value1', field2: 'value2' },
          output: { outputField1: 'outputValue1' },
        },
      };
      const dto: EvaluateRuleRunSchemaDto = { trace: mockTraceObject };
      const error = new Error('Unexpected error');

      jest.spyOn(service, 'evaluateRuleSchema').mockImplementation(() => {
        throw error;
      });

      await expect(controller.evaluateRuleSchema(dto)).rejects.toThrow(
        new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });
});
