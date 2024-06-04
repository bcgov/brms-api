import { Test, TestingModule } from '@nestjs/testing';
import { RuleMappingController } from './ruleMapping.controller';

describe('RuleMappingController', () => {
  let controller: RuleMappingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RuleMappingController],
    }).compile();

    controller = module.get<RuleMappingController>(RuleMappingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
