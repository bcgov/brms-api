export interface RuleField {
  id: string | number;
  name?: string;
  property: string;
  description?: string;
  type?: string;
  validationCriteria?: string;
  validationType?: string;
  child_fields?: RuleField[];
}

export interface RuleSchema {
  inputs: RuleField[];
  outputs?: RuleField[];
  resultOutputs: RuleField[];
}

export interface RuleRunResults {
  [scenarioId: string]: any;
}
