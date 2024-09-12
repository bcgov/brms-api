import { Test, TestingModule } from '@nestjs/testing';
import { KlammController } from './klamm.controller';
import { KlammService } from './klamm.service';

describe('KlammController', () => {
  let controller: KlammController;
  let service: KlammService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KlammController],
      providers: [
        {
          provide: KlammService,
          useValue: {
            getBREFields: jest.fn(() => Promise.resolve('expected result')),
            getBREFieldFromName: jest.fn((fieldName) => Promise.resolve(`result for ${fieldName}`)), // Mock implementation
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

  it('should call getBREFieldFromName with fieldName and return expected result', async () => {
    const fieldName = 'testField';
    expect(await controller.getBREFieldFromName(fieldName)).toBe(`result for ${fieldName}`);
    expect(service.getBREFieldFromName).toHaveBeenCalledWith(fieldName);
    expect(service.getBREFieldFromName).toHaveBeenCalledTimes(1);
  });
});
