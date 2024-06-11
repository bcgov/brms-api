import { readFile } from 'fs/promises';
import { Injectable } from '@nestjs/common';
import { ZenEngine, ZenEvaluateOptions } from '@gorules/zen-engine';

export const RULES_DIRECTORY = 'brms-rules/rules';

@Injectable()
export class DecisionsService {
  engine: ZenEngine;

  constructor() {
    this.engine = new ZenEngine();
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
      const content = await readFile(`${RULES_DIRECTORY}/${ruleFileName}`);
      return this.runDecision(content, context, options);
    } catch (error) {
      throw new Error(`Failed to run decision: ${error.message}`);
    }
  }
}
