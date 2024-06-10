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

export interface TraceObject {
  [key: string]: {
    id: string;
    name: string;
    input?: any;
    output: {
      [key: string]: any;
    } | null;
    performance?: string;
    traceData?: {
      index: number;
      reference_map: Record<string, any>;
      rule: Record<string, any>;
    };
  };
}
