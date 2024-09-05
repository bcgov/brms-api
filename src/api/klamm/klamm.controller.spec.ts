import { Test, TestingModule } from '@nestjs/testing';
import { KlammController } from './klamm.controller';
import { KlammService } from './klamm.service';

describe('KlammController', () => {
  let controller: KlammController;
  let service: KlammService;

  beforeEach(async () => {
    // Mock KlammService
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KlammController],
      providers: [
        {
          provide: KlammService,
          useValue: {
            getBREFields: jest.fn(() => Promise.resolve('expected result')),
          },
        },
      ],
    }).compile();

    controller = module.get<KlammController>(KlammController);
    service = module.get<KlammService>(KlammService);
  });

  it('should call getBREFields and return expected result', async () => {
    expect(await controller.getBREFields()).toBe('expected result');
    expect(service.getBREFields).toHaveBeenCalledTimes(1);
  });
});
