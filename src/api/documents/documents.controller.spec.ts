import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

describe('DocumentsController', () => {
  let documentsController: DocumentsController;
  let documentsService: DocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService,
          useValue: {
            getFileContent: jest.fn(),
          },
        },
      ],
    }).compile();

    documentsController = module.get<DocumentsController>(DocumentsController);
    documentsService = module.get<DocumentsService>(DocumentsService);
  });

  it('should return file content', async () => {
    const ruleFileName = 'test.json';
    const mockFileContent = Buffer.from(JSON.stringify({ key: 'value' }));
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    jest.spyOn(documentsService, 'getFileContent').mockResolvedValueOnce(mockFileContent);

    await documentsController.getRuleFile(ruleFileName, res);
    expect(res.send).toHaveBeenCalledWith(mockFileContent);
  });

  it('should throw an error when file not found', async () => {
    const ruleFileName = 'test.json';
    const mockError = new Error('File not found');
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    jest.spyOn(documentsService, 'getFileContent').mockRejectedValueOnce(mockError);

    await expect(documentsController.getRuleFile(ruleFileName, res)).rejects.toThrow(
      new HttpException(mockError.message, HttpStatus.INTERNAL_SERVER_ERROR),
    );
  });
});
