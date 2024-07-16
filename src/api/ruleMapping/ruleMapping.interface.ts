import { ZenEngineTrace } from '@gorules/zen-engine';

export interface Field {
  id: string;
  name: string;
  type: string;
  field: string;
}

export interface InputField extends Field {}

export interface OutputField extends Field {}

export interface Expression {
  key: string;
  value: string;
}

export interface NodeContent {
  inputs?: InputField[];
  outputs?: OutputField[];
  expressions?: Expression[];
}

export interface Node {
  id: any;
  type: string;
  content: NodeContent;
}

export interface Edge {
  id: string;
  type: string;
  targetId: string;
  sourceId: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface RuleContent {
  nodes: Node[];
  edges: Edge[];
}

export interface TraceObjectEntry extends ZenEngineTrace {
  id: string;
  name: string;
  input: any;
  output: any;
  performance?: string;
  traceData?: any;
}

export interface TraceObject {
  [key: string]: TraceObjectEntry;
}
