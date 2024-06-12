import { Controller, Get, Param, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DocumentsService } from './documents.service';

@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('/')
  // Get a list of all the JSON files in the rules directory
  async getAllDocuments() {
    return await this.documentsService.getAllJSONFiles();
  }

  @Get('/:ruleFileName')
  // Get a specific JSON file from the rules directory
  async getRuleFile(@Param('ruleFileName') ruleFileName: string, @Res() res: Response) {
    const fileContent = await this.documentsService.getFileContent(ruleFileName);

    try {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${ruleFileName}`);
      res.send(fileContent);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
