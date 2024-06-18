import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Edge, Node, TraceObject, TraceObjectEntry } from '../ruleMapping.interface';

export class EdgeClass implements Edge {
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

export class TraceObjectEntryClass implements TraceObjectEntry {
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

export class TraceObjectClass implements TraceObject {
  [key: string]: TraceObjectEntryClass;

  constructor(entries: { [key: string]: TraceObjectEntryClass }) {
    Object.assign(this, entries);
  }
}

export class EvaluateRuleMappingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Node)
  nodes: Node[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EdgeClass)
  edges: Edge[];
}

export class EvaluateRuleRunSchemaDto {
  @ValidateNested()
  @Type(() => TraceObjectClass)
  trace: TraceObject;
}
