import { readFile } from 'fs/promises';
import { Injectable } from '@nestjs/common';
import { ZenEngine, ZenEvaluateOptions } from '@gorules/zen-engine';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DecisionsService {
  engine: ZenEngine;
  rulesDirectory: string;

  constructor(private configService: ConfigService) {
    this.engine = new ZenEngine();
    this.rulesDirectory = this.configService.get<string>('RULES_DIRECTORY');
  }

  async runDecision(content: object, context: object, options: ZenEvaluateOptions) {
    try {
      const decision = this.engine.createDecision(content);
      return await decision.evaluate(context, options);
    } catch (error) {
      throw new Error(`Failed to run decision: ${error.message}`);
    }
  }

  async runDecisionByFile(ruleFileName: string, context: object, options: ZenEvaluateOptions) {
    try {
      const content = await readFile(`${this.rulesDirectory}/${ruleFileName}`);
      return this.runDecision(content, context, options);
    } catch (error) {
      throw new Error(`Failed to run decision: ${error.message}`);
    }
  }
}
