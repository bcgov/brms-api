import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RuleDataService } from './ruleData.service';
import { RuleData } from './ruleData.schema';

export const mockRuleData = {
  _id: 'testId',
  title: 'Title',
  goRulesJSONFilename: 'filename.json',
  chefsFormId: 'formId',
  chefsFormAPIKey: '12345',
};

export const mockServiceProviders = [
  RuleDataService,
  {
    provide: getModelToken(RuleData.name),
    useFactory: () => ({
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockRuleData]),
      }),
      findOne: jest.fn().mockImplementation((query) => ({
        exec: jest.fn().mockResolvedValue(mockRuleData),
      })),
    }),
  },
];

describe('RuleDataService', () => {
  let service: RuleDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: mockServiceProviders,
    }).compile();

    service = module.get<RuleDataService>(RuleDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get all rule data', async () => {
    const result = [mockRuleData];
    expect(await service.getAllRuleData()).toEqual(result);
  });

  it('should get data for a rule', async () => {
    expect(await service.getRuleData(mockRuleData._id)).toEqual(mockRuleData);
  });
});
