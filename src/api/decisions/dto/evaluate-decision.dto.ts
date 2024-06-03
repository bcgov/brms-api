import { IsBoolean, IsObject } from 'class-validator';

export class EvaluateDecisionDto {
  @IsObject()
  context: object;

  @IsBoolean()
  trace: boolean;
}

export class EvaluateDecisionWithContentDto extends EvaluateDecisionDto {
  @IsObject()
  content: object;
}
