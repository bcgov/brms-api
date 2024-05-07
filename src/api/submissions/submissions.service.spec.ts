import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SubmissionsService } from './submissions.service';
import { RuleDataService } from '../ruleData/ruleData.service';

export const SubmissionServiceMockProviders = [
  SubmissionsService,
  {
    provide: ConfigService,
    useValue: {
      get: jest.fn().mockReturnValue('mock value'),
    },
  },
  {
    provide: RuleDataService,
    useValue: {},
  },
];

describe('SubmissionsService', () => {
  let service: SubmissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: SubmissionServiceMockProviders,
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // TODO: Add more tests here for each method in your service
});
