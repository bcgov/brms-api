import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import * as util from 'util';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  const readFileMock = jest.fn();

  beforeEach(async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest.spyOn(util, 'promisify').mockReturnValue(readFileMock);
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService, DocumentsService],
    }).compile();
    service = module.get<DocumentsService>(DocumentsService);
  });

  it('should throw a 404 error if the file does not exist', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    await expect(service.getFileContent('path/to/nonexistent/file')).rejects.toThrow(
      new HttpException('File not found', HttpStatus.NOT_FOUND),
    );
  });

  it('should return file content if the file exists', async () => {
    const mockContent = Buffer.from('file content');
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    readFileMock.mockResolvedValue(mockContent);

    const result = await service.getFileContent('path/to/existing/file');

    expect(result).toBe(mockContent);
    expect(readFileMock).toHaveBeenCalledWith(`${service.rulesDirectory}/path/to/existing/file`);
  });

  it('should throw a 500 error if reading the file fails', async () => {
    const errorMessage = 'Read error';
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    readFileMock.mockRejectedValue(new Error(errorMessage));

    await expect(service.getFileContent('path/to/existing/file')).rejects.toThrow(
      new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR),
    );
  });
});
