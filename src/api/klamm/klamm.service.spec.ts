import { Test, TestingModule } from '@nestjs/testing';
import { KlammService } from './klamm.service';
import axios from 'axios';
import { HttpException } from '@nestjs/common';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('KlammService', () => {
  let service: KlammService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KlammService],
    }).compile();

    service = module.get<KlammService>(KlammService);

    // Set environment variables for testing
    process.env.KLAMM_API_URL = 'https://test.api';
    process.env.KLAMM_API_AUTH_TOKEN = 'test-token';
  });

  it('should return data on successful API call', async () => {
    const responseData = ['field1', 'field2', 'field3'];
    mockedAxios.get.mockResolvedValue({ data: responseData });

    await expect(service.getBREFields()).resolves.toEqual(responseData);
    expect(mockedAxios.get).toHaveBeenCalledWith(`${process.env.KLAMM_API_URL}/api/brefields`, {
      headers: {
        Authorization: `Bearer ${process.env.KLAMM_API_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
  });

  it('should throw HttpException on API call failure', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Error fetching from Klamm'));

    await expect(service.getBREFields()).rejects.toThrow(HttpException);
    await expect(service.getBREFields()).rejects.toThrow('Error fetching from Klamm');
  });
});
