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
            getKlammBREFields: jest.fn(() => Promise.resolve('expected result')),
            getKlammBREFieldFromName: jest.fn((fieldName) => Promise.resolve(`result for ${fieldName}`)), // Mock implementation
            _getAllKlammFields: jest.fn(() => Promise.resolve('rules result')),
          },
        },
      ],
    }).compile();

    controller = module.get<KlammController>(KlammController);
    service = module.get<KlammService>(KlammService);
  });

  it('should call getBREFields and return expected result', async () => {
    expect(await controller.getKlammBREFields('test')).toBe('expected result');
    expect(service.getKlammBREFields).toHaveBeenCalledTimes(1);
  });

  it('should call getKlammFieldFromName with fieldName and return expected result', async () => {
    const fieldName = 'testField';
    expect(await controller.getKlammBREFieldFromName(fieldName)).toBe(`result for ${fieldName}`);
    expect(service.getKlammBREFieldFromName).toHaveBeenCalledWith(fieldName);
    expect(service.getKlammBREFieldFromName).toHaveBeenCalledTimes(1);
  });

  it('should call _getAllKlammFields and return expected result', async () => {
    expect(await controller.getKlammBRERules()).toBe('rules result');
    expect(service._getAllKlammFields).toHaveBeenCalledTimes(1);
  });
});
