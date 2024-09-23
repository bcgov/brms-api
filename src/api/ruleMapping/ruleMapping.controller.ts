import { Controller, Res, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { RuleMappingService, InvalidRuleContent } from './ruleMapping.service';
import { Response } from 'express';
import { EvaluateRuleRunSchemaDto, EvaluateRuleMappingDto } from './dto/evaluate-rulemapping.dto';

@Controller('api/rulemap')
export class RuleMappingController {
  constructor(private ruleMappingService: RuleMappingService) {}

  // Map a rule file to its unique inputs, and all outputs
  @Post('/')
  async getRuleSchema(
    @Body('goRulesJSONFilename') goRulesJSONFilename: string,
    @Body('ruleContent') ruleContent: EvaluateRuleMappingDto,
    @Res() res: Response,
  ) {
    const rulemap = await this.ruleMappingService.inputOutputSchema(ruleContent);

    try {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${goRulesJSONFilename}`);
      res.send(rulemap);
    } catch (error) {
      if (error instanceof InvalidRuleContent) {
        throw new HttpException('Invalid rule content', HttpStatus.BAD_REQUEST);
      } else {
        throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  // Map a rule to its unique inputs, and all outputs
  @Post('/evaluate')
  async evaluateRuleMap(@Body() ruleContent: EvaluateRuleMappingDto) {
    try {
      const result = await this.ruleMappingService.inputOutputSchema(ruleContent);
      return { result };
    } catch (error) {
      if (error instanceof InvalidRuleContent) {
        throw new HttpException('Invalid rule content', HttpStatus.BAD_REQUEST);
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

  // Map a rule file using only the rule content
  @Post('/generateFromRuleContent')
  async generateWithoutInputOutputNodes(
    @Body('ruleContent') ruleContent: EvaluateRuleMappingDto,
    @Res() res: Response,
  ) {
    const rulemap = await this.ruleMappingService.ruleSchema(ruleContent);

    try {
      res.setHeader('Content-Type', 'application/json');
      res.send(rulemap);
    } catch (error) {
      if (error instanceof InvalidRuleContent) {
        throw new HttpException('Invalid rule content', HttpStatus.BAD_REQUEST);
      } else {
        throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
}
