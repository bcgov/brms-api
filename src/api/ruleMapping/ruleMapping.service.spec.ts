import { Test, TestingModule } from '@nestjs/testing';
import { RuleMappingService } from './ruleMapping.service';

describe('RuleMappingService', () => {
  let service: RuleMappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RuleMappingService],
    }).compile();

    service = module.get<RuleMappingService>(RuleMappingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
