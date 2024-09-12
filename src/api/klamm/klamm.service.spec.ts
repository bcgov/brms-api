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
    // Set environment variables for testing
    process.env.KLAMM_API_URL = 'https://test.api';
    process.env.KLAMM_API_AUTH_TOKEN = 'test-token';

    mockedAxios.create.mockReturnThis();

    service = new KlammService();
  });

  it('should return data on successful API call', async () => {
    const responseData = ['field1', 'field2', 'field3'];
    mockedAxios.get.mockResolvedValue({ data: responseData });

    await expect(service.getBREFields()).resolves.toEqual(responseData);
    expect(mockedAxios.get).toHaveBeenCalledWith(`${process.env.KLAMM_API_URL}/api/brefields`);
  });

  it('should throw HttpException on API call failure', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Error fetching from Klamm'));

    await expect(service.getBREFields()).rejects.toThrow(HttpException);
    await expect(service.getBREFields()).rejects.toThrow('Error fetching from Klamm');
  });

  it('should return the first field data on successful API call', async () => {
    const fieldName = 'testField';
    const responseData = { data: [{ id: 1, name: fieldName }] };
    mockedAxios.get.mockResolvedValue({ data: responseData });

    await expect(service.getBREFieldFromName(fieldName)).resolves.toEqual(responseData.data[0]);
    expect(mockedAxios.get).toHaveBeenCalledWith(`${process.env.KLAMM_API_URL}/api/brefields`, {
      params: { name: fieldName },
    });
  });

  it('should throw HttpException with BAD_REQUEST if no field exists', async () => {
    const fieldName = 'nonexistentField';
    mockedAxios.get.mockResolvedValue({ data: { data: [] } });

    await expect(service.getBREFieldFromName(fieldName)).rejects.toThrow(HttpException);
    await expect(service.getBREFieldFromName(fieldName)).rejects.toThrow('Field name does not exist');
  });

  it('should throw HttpException with INTERNAL_SERVER_ERROR on API call failure', async () => {
    const fieldName = 'testField';
    mockedAxios.get.mockRejectedValue(new Error('Error fetching from Klamm'));

    await expect(service.getBREFieldFromName(fieldName)).rejects.toThrow(HttpException);
    await expect(service.getBREFieldFromName(fieldName)).rejects.toThrow('Error fetching from Klamm');
  });
});
