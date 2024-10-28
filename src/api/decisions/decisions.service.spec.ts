import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ZenEngine, ZenDecision, ZenEvaluateOptions } from '@gorules/zen-engine';
import { DecisionsService } from './decisions.service';
import { ValidationService } from './validations/validations.service';
import { readFileSafely } from '../../utils/readFile';

jest.mock('../../utils/readFile', () => ({
  readFileSafely: jest.fn(),
  FileNotFoundError: jest.fn(),
}));

describe('DecisionsService', () => {
  let service: DecisionsService;
  let validationService: ValidationService;
  let mockEngine: Partial<ZenEngine>;
  let mockDecision: Partial<ZenDecision>;

  beforeEach(async () => {
    mockDecision = {
      evaluate: jest.fn(),
    };
    mockEngine = {
      createDecision: jest.fn().mockReturnValue(mockDecision),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService, DecisionsService, ValidationService, { provide: ZenEngine, useValue: mockEngine }],
    }).compile();

    service = module.get<DecisionsService>(DecisionsService);
    validationService = module.get<ValidationService>(ValidationService);
    service.engine = mockEngine as ZenEngine;
    jest.spyOn(validationService, 'validateInputs').mockImplementation(() => {});
  });

  describe('runDecision', () => {
    it('should run a decision', async () => {
      const ruleFileName = 'rule';
      const ruleContent = { nodes: [], edges: [] };
      const context = {};
      const options: ZenEvaluateOptions = { trace: false };
      await service.runDecision(ruleContent, ruleFileName, context, options);
      expect(mockEngine.createDecision).toHaveBeenCalledWith(ruleContent);
      expect(mockDecision.evaluate).toHaveBeenCalledWith(context, options);
    });

    it('should throw an error if the decision fails', async () => {
      const ruleFileName = 'rule';
      const ruleContent = { nodes: [], edges: [] };
      const context = {};
      const options: ZenEvaluateOptions = { trace: false };
      (mockDecision.evaluate as jest.Mock).mockRejectedValue(new Error('Error'));
      await expect(service.runDecision(ruleContent, ruleFileName, context, options)).rejects.toThrow(
        'Failed to run decision: Error',
      );
    });
  });

  describe('runDecisionByContent', () => {
    it('should run a decision by content', async () => {
      const ruleContent = { nodes: [], edges: [] };
      const context = {};
      const options: ZenEvaluateOptions = { trace: false };
      await service.runDecisionByContent(ruleContent, context, options);
      expect(mockEngine.createDecision).toHaveBeenCalledWith(ruleContent);
      expect(mockDecision.evaluate).toHaveBeenCalledWith(context, options);
    });

    it('should throw an error if the decision fails', async () => {
      const ruleContent = { nodes: [], edges: [] };
      const context = {};
      const options: ZenEvaluateOptions = { trace: false };
      (mockDecision.evaluate as jest.Mock).mockRejectedValue(new Error('Error'));
      await expect(service.runDecisionByContent(ruleContent, context, options)).rejects.toThrow(
        'Failed to run decision: Error',
      );
    });
  });

  describe('runDecisionByFile', () => {
    it('should read a file and run a decision', async () => {
      const ruleFileName = 'rule';
      const context = {};
      const options: ZenEvaluateOptions = { trace: false };
      const content = { rule: 'rule' };
      (readFileSafely as jest.Mock).mockResolvedValue(Buffer.from(JSON.stringify(content)));
      await service.runDecisionByFile(ruleFileName, context, options);
      expect(readFileSafely).toHaveBeenCalledWith(service.rulesDirectory, ruleFileName);
      expect(mockEngine.createDecision).toHaveBeenCalledWith(content);
      expect(mockDecision.evaluate).toHaveBeenCalledWith(context, options);
    });

    it('should throw an error if reading the file fails', async () => {
      const ruleFileName = 'rule';
      const context = {};
      const options: ZenEvaluateOptions = { trace: false };
      (readFileSafely as jest.Mock).mockRejectedValue(new Error('Error'));
      await expect(service.runDecisionByFile(ruleFileName, context, options)).rejects.toThrow(
        'Failed to run decision: Error',
      );
    });
  });
});
