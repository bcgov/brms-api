export interface KlammField {
  id: number;
  name: string;
  label: string;
  description: string;
}

export interface KlammRulePayload {
  name: string;
  label: string;
  rule_inputs: KlammField[];
  rule_outputs: KlammField[];
  child_rules: KlammRulePayload[];
}

export interface KlammRule extends KlammRulePayload {
  id: number;
}
