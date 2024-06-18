import { Controller, Post, Query, Body, HttpException, HttpStatus } from '@nestjs/common';
import { DecisionsService } from './decisions.service';
import { EvaluateDecisionDto, EvaluateDecisionWithContentDto } from './dto/evaluate-decision.dto';

@Controller('api/decisions')
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  @Post('/evaluate')
  async evaluateDecisionByContent(@Body() { content, context, trace }: EvaluateDecisionWithContentDto) {
    try {
      return await this.decisionsService.runDecision(content, context, { trace });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
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
