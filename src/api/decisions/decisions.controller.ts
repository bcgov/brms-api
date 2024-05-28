import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { DecisionsService } from './decisions.service';

@Controller('api/decisions')
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  @Get('/:ruleId')
  async getSubmissions(@Param('ruleId') ruleId: string) {
    try {
      // TODO: Get inputs from request
      return await this.decisionsService.runDecision({
        numberOfChildren: 2,
        familyComposition: 'single',
        familyUnitInPayForDecember: true,
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('/:formId/:id')
  async getSubmissionById(@Param('formId') formId: string, @Param('id') id: string) {}
}
