import { Controller, Post, Query, Body, HttpException, HttpStatus } from '@nestjs/common';
import { DecisionsService } from './decisions.service';
import { EvaluateDecisionDto, EvaluateDecisionWithContentDto } from './dto/evaluate-decision.dto';
import { ValidationError } from './validations/validationError.service';

@Controller('api/decisions')
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  @Post('/evaluate')
  async evaluateDecisionByContent(@Body() { ruleContent, context, trace }: EvaluateDecisionWithContentDto) {
    try {
      return await this.decisionsService.runDecisionByContent(ruleContent, context, { trace });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      } else {
        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  @Post('/evaluateByFile')
  async evaluateDecisionByFile(
    @Query('ruleFileName') ruleFileName: string,
    @Body() { context, trace }: EvaluateDecisionDto,
  ) {
    try {
      return await this.decisionsService.runDecisionByFile(ruleFileName, context, { trace });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
