import { IsBoolean, IsObject } from 'class-validator';
import { RuleContent } from 'src/api/ruleMapping/ruleMapping.interface';

export class EvaluateDecisionDto {
  @IsObject()
  context: object;

  @IsBoolean()
  trace: boolean;
}

export class EvaluateDecisionWithContentDto extends EvaluateDecisionDto {
  @IsObject()
  ruleContent: RuleContent;
}
