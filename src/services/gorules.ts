import { ZenEngine } from '@gorules/zen-engine';
import { readFile } from 'fs/promises';

export const runDecision = async (rulename: string, inputs: object) => {
  const content = await readFile('src/rules/wintersupplement.json');
  const engine = new ZenEngine();
  const decision = engine.createDecision(content);
  const result = await decision.evaluate(inputs);
  return result;
};
