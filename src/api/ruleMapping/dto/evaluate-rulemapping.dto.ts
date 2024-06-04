import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Node } from '../ruleMapping.interface';

export class EvaluateRuleMappingDto {
  @IsArray()
  @ValidateNested()
  @Type(() => Node)
  nodes: Node[];
}
