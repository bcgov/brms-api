import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { readFileSafely } from '../../utils/readFile';

jest.mock('../../utils/readFile', () => ({
  readFileSafely: jest.fn(),
  FileNotFoundError: jest.fn(),
}));

describe('DocumentsService', () => {
  let service: DocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService, DocumentsService],
    }).compile();
    service = module.get<DocumentsService>(DocumentsService);
  });

  it('should throw a 404 error if the file does not exist', async () => {
    (readFileSafely as jest.Mock).mockRejectedValue(new Error('File not found'));

    await expect(service.getFileContent('path/to/nonexistent/file')).rejects.toThrow(
      new HttpException('File not found', HttpStatus.NOT_FOUND),
    );
  });

  it('should return file content if the file exists', async () => {
    const mockContent = Buffer.from('file content');
    (readFileSafely as jest.Mock).mockResolvedValue(mockContent);

    const result = await service.getFileContent('path/to/existing/file');

    expect(result).toBe(mockContent);
    expect(readFileSafely).toHaveBeenCalledWith(service.rulesDirectory, 'path/to/existing/file');
  });

  it('should throw a 500 error if reading the file fails', async () => {
    const errorMessage = 'Read error';
    (readFileSafely as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(service.getFileContent('path/to/existing/file')).rejects.toThrow(
      new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR),
    );
  });
});
