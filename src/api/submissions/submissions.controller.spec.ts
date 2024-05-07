import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { Submission } from './submission.interface';
import { SubmissionServiceMockProviders } from './submissions.service.spec';

describe('SubmissionsController', () => {
  let controller: SubmissionsController;
  let service: SubmissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubmissionsController],
      providers: SubmissionServiceMockProviders,
    }).compile();

    controller = module.get<SubmissionsController>(SubmissionsController);
    service = module.get<SubmissionsService>(SubmissionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get submissions', async () => {
    const result: Submission[] = [];
    jest.spyOn(service, 'getSubmissions').mockImplementation(() => Promise.resolve(result));
    expect(await controller.getSubmissions('formId')).toBe(result);
  });

  it('should get submission by id', async () => {
    const result: Submission = {
      submissionId: '123456',
      createdBy: 'TestCreator',
      createdAt: new Date().toDateString(),
      submission: {
        data: {
          name: 'TestName',
          age: 25,
        },
      },
    };
    jest.spyOn(service, 'getSubmissionById').mockImplementation(() => Promise.resolve(result));
    expect(await controller.getSubmissionById('formId', 'id')).toBe(result);
  });
});
