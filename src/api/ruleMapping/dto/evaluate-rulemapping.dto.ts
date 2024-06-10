import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Edge, Node } from '../ruleMapping.interface';

export class EvaluateRuleMappingDto {
  @IsArray()
  @ValidateNested()
  @Type(() => Node)
  nodes: Node[];
  edges: Edge[];
}
