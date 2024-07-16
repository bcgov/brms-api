export interface RuleSchema {
  inputs: Array<{ id: string; name?: string; property: string }>;
  outputs: Array<{ id: string; name?: string; property: string }>;
  resultOutputs: Array<{ id: string; name?: string; property: string }>;
}

export interface RuleRunResults {
  [scenarioId: string]: any;
}
