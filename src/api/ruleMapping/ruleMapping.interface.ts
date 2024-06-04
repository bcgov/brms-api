export interface InputField {
  id: string;
  name: string;
  type: string;
  field: string;
}

export interface OutputField {
  id: string;
  name: string;
  type: string;
  field: string;
}

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
  type: string;
  content: NodeContent;
}
