import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Variable } from '../scenarioData.schema';

export class VariableClass implements Variable {
  name: string;
  value: any;
  type: string;
}

export class CreateScenarioDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  ruleID: string;

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => VariableClass)
  variables: VariableClass[];

  @IsNotEmpty()
  @IsString()
  goRulesJSONFilename: string;
}
