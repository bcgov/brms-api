import { Controller, Get, Param, Res, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { RuleMappingService } from './ruleMapping.service';
import { Response } from 'express';
import { EvaluateRuleRunSchemaDto, EvaluateRuleMappingDto } from './dto/evaluate-rulemapping.dto';
@Controller('api/rulemap')
export class RuleMappingController {
  constructor(private ruleMappingService: RuleMappingService) {}

  // Map a rule file to its unique inputs, and all outputs
  @Get('/:ruleFileName')
  async getRuleFile(@Param('ruleFileName') ruleFileName: string, @Res() res: Response) {
    const rulemap = await this.ruleMappingService.ruleSchemaFile(ruleFileName);

    try {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${ruleFileName}`);
      res.send(rulemap);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Map a rule to its unique inputs, and all outputs
  @Post('/evaluate')
  async evaluateRuleMap(@Body() { nodes, edges }: EvaluateRuleMappingDto) {
    try {
      if (!nodes || !Array.isArray(nodes)) {
        throw new HttpException('Invalid request data', HttpStatus.BAD_REQUEST);
      }
      const result = this.ruleMappingService.ruleSchema(nodes, edges);
      return { result };
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.BAD_REQUEST) {
        throw error;
      } else {
        throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  // Map a rule to its unique inputs, and all outputs, based on the trace data of a rule run
  @Post('/rulerunschema')
  async evaluateRuleSchema(@Body() { trace }: EvaluateRuleRunSchemaDto) {
    try {
      if (!trace) {
        throw new HttpException('Invalid request data', HttpStatus.BAD_REQUEST);
      }
      const result = this.ruleMappingService.evaluateRuleSchema(trace);
      return { result };
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.BAD_REQUEST) {
        throw error;
      } else {
        throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
}
