import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Edge, Node, TraceObject } from '../ruleMapping.interface';

export class EvaluateRuleMappingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Node)
  nodes: Node[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Edge)
  edges: Edge[];
}

export class EvaluateRuleRunSchemaDto {
  @ValidateNested()
  @Type(() => TraceObject)
  trace: TraceObject;
}
