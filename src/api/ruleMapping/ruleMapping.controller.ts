import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { RuleMappingService } from './ruleMapping.service';
import { EvaluateRuleMappingDto } from './dto/evaluate-rulemapping.dto';

@Controller('api/rulemap')
export class RuleMappingController {
  constructor(private readonly ruleMappingService: RuleMappingService) {}

  // List all inputs and outputs of the rule
  @Post('/list')
  async listRuleMap(@Body() { nodes }: EvaluateRuleMappingDto) {
    try {
      if (!nodes || !Array.isArray(nodes)) {
        throw new HttpException('Invalid request data', HttpStatus.BAD_REQUEST);
      }
      const result = this.ruleMappingService.extractInputsAndOutputs(nodes);
      return { result };
    } catch (error) {
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Map the rule to its unique inputs and outputs, excluding intermediary fields
  @Post('/evaluate')
  async evaluateRuleMap(@Body() { nodes }: EvaluateRuleMappingDto) {
    try {
      if (!nodes || !Array.isArray(nodes)) {
        throw new HttpException('Invalid request data', HttpStatus.BAD_REQUEST);
      }
      const result = this.ruleMappingService.processJsonData(nodes);
      return { result };
    } catch (error) {
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
