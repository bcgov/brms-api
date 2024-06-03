import { DocumentsService } from './documents.service'; // Adjust the path as needed
import { HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as util from 'util';

describe('DocumentsService', () => {
  let service: DocumentsService;
  const readFileMock = jest.fn();

  beforeEach(() => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest.spyOn(util, 'promisify').mockReturnValue(readFileMock);
    service = new DocumentsService();
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
    expect(readFileMock).toHaveBeenCalledWith('path/to/existing/file');
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
