import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { Submission } from './submission.interface';

@Controller('api/submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get('/list/:formId')
  async getSubmissions(@Param('formId') formId: string): Promise<Submission[]> {
    try {
      return await this.submissionsService.getSubmissions(formId);
    } catch (error) {
      throw new HttpException('Error getting submissions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('/:id')
  async getSubmissionById(@Param('id') id: string): Promise<Submission> {
    try {
      return await this.submissionsService.getSubmissionById(id);
    } catch (error) {
      throw new HttpException('Error getting submission by id', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
