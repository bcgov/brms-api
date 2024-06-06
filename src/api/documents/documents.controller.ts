import { Controller, Get, Param, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DocumentsService } from './documents.service';

@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('/:ruleFileName')
  async getRuleFile(@Param('ruleFileName') ruleFileName: string, @Res() res: Response) {
    const filePath = `rules-repo/rules/${ruleFileName}`;
    const fileContent = await this.documentsService.getFileContent(filePath);

    try {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${ruleFileName}`);
      res.send(fileContent);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
