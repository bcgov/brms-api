import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DocumentsService } from '../documents/documents.service';
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
      findOne: jest.fn().mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockRuleData),
      })),
    }),
  },
  {
    provide: DocumentsService,
    useValue: {
      getAllJSONFiles: jest.fn().mockResolvedValue(['doc1.json', 'doc2.json']),
    },
  },
];

describe('RuleDataService', () => {
  let service: RuleDataService;
  let documentsService: DocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: mockServiceProviders,
    }).compile();

    service = module.get<RuleDataService>(RuleDataService);
    documentsService = module.get<DocumentsService>(DocumentsService);
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

  it('should add unsynced files correctly', async () => {
    // Mock the expected behavior getting db files, getting repo files, and adding to db
    const unsyncedFiles = ['file1.txt', 'file2.txt'];
    jest.spyOn(service, 'getAllRuleData').mockResolvedValue([mockRuleData]);
    jest.spyOn(documentsService, 'getAllJSONFiles').mockResolvedValue(unsyncedFiles);
    jest.spyOn(service, 'createRuleData').mockImplementation((file: RuleData) => Promise.resolve(file));

    await service.addUnsyncedFiles();

    expect(service.createRuleData).toHaveBeenCalled();
    expect(documentsService.getAllJSONFiles).toHaveBeenCalled();
    expect(service.createRuleData).toHaveBeenCalledTimes(unsyncedFiles.length);
  });
});
