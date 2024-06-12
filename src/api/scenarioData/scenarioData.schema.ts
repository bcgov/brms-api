import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ScenarioDataDocument = ScenarioData & Document;

@Schema()
export class ScenarioData {
  @Prop({ required: true, description: 'The scenario ID', type: Types.ObjectId })
  _id: Types.ObjectId;

  @Prop({ description: 'The title of the scenario' })
  title: string;

  @Prop({
    ref: 'RuleData',
    required: true,
    description: 'The ID of the rule',
  })
  ruleID: string;

  @Prop({ required: true, description: 'The filename of the JSON file containing the rule' })
  goRulesJSONFilename: string;
}

export const ScenarioDataSchema = SchemaFactory.createForClass(ScenarioData);
