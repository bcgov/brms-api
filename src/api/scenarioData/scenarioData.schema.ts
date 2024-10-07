import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ScenarioDataDocument = ScenarioData & Document;
export interface Variable {
  name: string;
  value: any;
  type?: string;
}

@Schema()
export class VariableSchema {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: {} })
  value: any;

  @Prop({ required: false, type: String, default: '' })
  type: string;
}

const VariableModelSchema = SchemaFactory.createForClass(VariableSchema);

// impute the type of the value if not provided
VariableModelSchema.pre<Variable>('save', function (next) {
  if (!this.type) {
    this.type = typeof this.value;
  }
  next();
});

@Schema()
export class ScenarioData {
  @Prop({ description: 'The title of the scenario' })
  title: string;

  @Prop({
    ref: 'RuleData',
    required: true,
    description: 'The ID of the rule',
  })
  ruleID: string;

  @Prop({
    required: true,
    description: 'The variables of the scenario',
    type: [VariableModelSchema],
  })
  variables: Variable[];

  @Prop({
    required: false,
    description: 'The expected result of the scenario',
    type: [VariableModelSchema],
  })
  expectedResults: Variable[];

  @Prop({ required: true, description: 'The filename of the JSON file containing the rule' })
  filepath: string;
}

export const ScenarioDataSchema = SchemaFactory.createForClass(ScenarioData);
