import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ZenEngine, ZenEvaluateOptions } from '@gorules/zen-engine';
import { ConfigService } from '@nestjs/config';
import { RuleContent } from '../ruleMapping/ruleMapping.interface';
import { readFileSafely, FileNotFoundError } from '../../utils/readFile';

@Injectable()
export class DecisionsService {
  engine: ZenEngine;
  rulesDirectory: string;

  constructor(private configService: ConfigService) {
    this.rulesDirectory = this.configService.get<string>('RULES_DIRECTORY');
    const loader = async (key: string) => readFileSafely(this.rulesDirectory, key);
    this.engine = new ZenEngine({ loader });
  }

  async runDecisionByContent(ruleContent: RuleContent, context: object, options: ZenEvaluateOptions) {
    try {
      const decision = this.engine.createDecision(ruleContent);
      return await decision.evaluate(context, options);
    } catch (error) {
      console.error(error.message);
      throw new Error(`Failed to run decision: ${error.message}`);
    }
  }

  async runDecisionByFile(ruleFileName: string, context: object, options: ZenEvaluateOptions) {
    try {
      const decisionFile = await readFileSafely(this.rulesDirectory, ruleFileName);
      const content: RuleContent = JSON.parse(decisionFile.toString()); // Convert file buffer to rulecontent
      return this.runDecisionByContent(content, context, options);
    } catch (error) {
      if (error instanceof FileNotFoundError) {
        throw new HttpException('Rule not found', HttpStatus.NOT_FOUND);
      } else {
        throw new HttpException(`Failed to run decision: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  /** Run the decision by content if it exists, otherwise run by filename */
  async runDecision(ruleContent: RuleContent, ruleFileName: string, context: object, options: ZenEvaluateOptions) {
    if (ruleContent) {
      return await this.runDecisionByContent(ruleContent, context, options);
    } else {
      return await this.runDecisionByFile(ruleFileName, context, options);
    }
  }
}
