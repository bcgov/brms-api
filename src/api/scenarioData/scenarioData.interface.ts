export interface RuleSchema {
  inputs: Array<{ id: string; property: string }>;
  finalOutputs: Array<{ id: string; property: string }>;
}

export interface RuleRunResults {
  [scenarioId: string]: any;
}
