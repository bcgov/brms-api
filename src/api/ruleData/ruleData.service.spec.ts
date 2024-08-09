import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DocumentsService } from '../documents/documents.service';
import { RuleDataService } from './ruleData.service';
import { RuleData } from './ruleData.schema';
import { RuleDraft } from './ruleDraft.schema';
import axios from 'axios';

export const mockRuleData = {
  _id: 'testId',
  title: 'Title',
  goRulesJSONFilename: 'filename.json',
};
const mockRuleDraft = { content: { nodes: [], edges: [] } };

class MockRuleDataModel {
  constructor(private data: RuleData) {}
  save = jest.fn().mockResolvedValue(this.data);
  static find = jest.fn();
  static findById = jest.fn().mockReturnThis();
  static findOne = jest.fn();
  static findOneAndDelete = jest.fn();
}

export const mockServiceProviders = [
  RuleDataService,
  {
    provide: getModelToken(RuleDraft.name),
    useFactory: () => ({}),
  },
  {
    provide: getModelToken(RuleData.name),
    useValue: MockRuleDataModel,
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
    const ruleDataList: RuleData[] = [mockRuleData];
    MockRuleDataModel.find = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(ruleDataList) });
    expect(await service.getAllRuleData()).toEqual(ruleDataList);
  });

  it('should return a rule draft for a given ruleId', async () => {
    const mockDataWithDraft = { ...mockRuleData, ruleDraft: mockRuleDraft };
    MockRuleDataModel.findById = jest.fn().mockImplementation(() => ({
      populate: jest.fn().mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockDataWithDraft),
      })),
    }));
    expect(await service.getRuleDataWithDraft(mockRuleData._id)).toEqual(mockDataWithDraft.ruleDraft);
  });

  it('should get data for a rule', async () => {
    MockRuleDataModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockRuleData) });
    expect(await service.getRuleData(mockRuleData._id)).toEqual(mockRuleData);
  });

  it('should create rule data', async () => {
    expect(await service.createRuleData(mockRuleData)).toEqual(mockRuleData);
  });

  it('should update rule data', async () => {
    const newData = { title: 'New Title', isPublished: true };
    const modelInstance = new MockRuleDataModel(mockRuleData);
    MockRuleDataModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(modelInstance) });
    modelInstance.save = jest.fn().mockResolvedValue({ ...mockRuleData, ...newData });
    expect(await service.updateRuleData(mockRuleData._id, newData)).toEqual({ ...mockRuleData, ...newData });
  });

  it('should delete rule data', async () => {
    MockRuleDataModel.findOneAndDelete = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockRuleData) });
    expect(await service.deleteRuleData(mockRuleData._id)).toEqual(mockRuleData);
  });

  it('should correctly remove inReview statuses when branches no longer exist', async () => {
    const ruleWithBranchToRemove: RuleData = {
      _id: 'testId1',
      title: 'Title 1',
      goRulesJSONFilename: 'filename1.json',
      reviewBranch: 'myoldbranch',
    };
    const ruleWithBranchToKeep: RuleData = {
      _id: 'testId2',
      title: 'Title 2',
      goRulesJSONFilename: 'filename2.json',
      reviewBranch: 'branch2',
    };
    const ruleWithoutBranch: RuleData = {
      _id: 'testId3',
      title: 'Title 3',
      goRulesJSONFilename: 'filename3.json',
    };
    const mockedbranches = { data: [{ name: 'branch1' }, { name: ruleWithBranchToKeep.reviewBranch }] };
    jest.spyOn(axios, 'get').mockResolvedValue(mockedbranches);
    jest
      .spyOn(service, 'updateRuleData')
      .mockImplementation((ruleId: string, rData: RuleData) => Promise.resolve(rData));

    await service.updateInReviewStatus([ruleWithBranchToRemove, ruleWithBranchToKeep, ruleWithoutBranch]);

    expect(service.updateRuleData).toHaveBeenCalledTimes(1);
    expect(service.updateRuleData).toHaveBeenCalledWith(ruleWithBranchToRemove._id, { reviewBranch: null });
  });

  it('should add unsynced files correctly', async () => {
    const unsyncedFiles = ['file1.txt', 'file2.txt'];
    jest.spyOn(documentsService, 'getAllJSONFiles').mockResolvedValue(unsyncedFiles);
    jest.spyOn(service, 'createRuleData').mockImplementation((rData: RuleData) => Promise.resolve(rData));

    await service.addUnsyncedFiles([mockRuleData]);

    expect(documentsService.getAllJSONFiles).toHaveBeenCalled();
    expect(service.createRuleData).toHaveBeenCalledTimes(unsyncedFiles.length);
  });

  it('should handle adding duplicate files gracefully', async () => {
    const unsyncedFiles = ['file1.txt', mockRuleData.goRulesJSONFilename];
    jest.spyOn(documentsService, 'getAllJSONFiles').mockResolvedValue(unsyncedFiles);
    jest.spyOn(service, 'createRuleData').mockImplementation((rData: RuleData) => Promise.resolve(rData));
    jest
      .spyOn(service, 'updateRuleData')
      .mockImplementation((ruleId: string, rData: RuleData) => Promise.resolve(rData));

    await service.addUnsyncedFiles([mockRuleData]);

    expect(documentsService.getAllJSONFiles).toHaveBeenCalled();
    expect(service.createRuleData).toHaveBeenCalledTimes(1);
    expect(service.updateRuleData).toHaveBeenCalledTimes(1);
  });
});
