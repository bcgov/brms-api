import { ZenEngineTrace } from '@gorules/zen-engine';

export class Field {
  id: string;
  name: string;
  type: string;
  field: string;

  constructor(id: string, name: string, type: string, field: string) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.field = field;
  }
}

export class InputField extends Field {
  constructor(id: string, name: string, type: string, field: string) {
    super(id, name, type, field);
  }
}

export class OutputField extends Field {
  constructor(id: string, name: string, type: string, field: string) {
    super(id, name, type, field);
  }
}

export class Expression {
  key: string;
  value: string;

  constructor(key: string, value: string) {
    this.key = key;
    this.value = value;
  }
}

export class NodeContent {
  inputs?: InputField[];
  outputs?: OutputField[];
  expressions?: Expression[];

  constructor(inputs?: InputField[], outputs?: OutputField[], expressions?: Expression[]) {
    this.inputs = inputs || [];
    this.outputs = outputs || [];
    this.expressions = expressions || [];
  }
}

export class Node {
  id: any;
  type: string;
  content: NodeContent;

  constructor(id: any, type: string, content: NodeContent) {
    this.id = id;
    this.type = type;
    this.content = content;
  }
}

export class Edge {
  id: string;
  type: string;
  targetId: string;
  sourceId: string;
  sourceHandle?: string;
  targetHandle?: string;

  constructor(
    id: string,
    type: string,
    targetId: string,
    sourceId: string,
    sourceHandle?: string,
    targetHandle?: string,
  ) {
    this.id = id;
    this.type = type;
    this.targetId = targetId;
    this.sourceId = sourceId;
    this.sourceHandle = sourceHandle;
    this.targetHandle = targetHandle;
  }
}

export class TraceObjectEntry implements ZenEngineTrace {
  id: string;
  name: string;
  input: any;
  output: any;
  performance?: string;
  traceData?: any;

  constructor(id: string, name: string, input: any, output: any, performance?: string, traceData?: any) {
    this.id = id;
    this.name = name;
    this.input = input;
    this.output = output;
    this.performance = performance;
    this.traceData = traceData;
  }
}

export class TraceObject {
  [key: string]: TraceObjectEntry;

  constructor(entries: { [key: string]: TraceObjectEntry }) {
    Object.assign(this, entries);
  }
}
