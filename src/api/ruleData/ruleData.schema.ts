import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RuleDataDocument = RuleData & Document;

@Schema()
export class RuleData {
  @Prop({ required: true, description: 'The GoRules ID' })
  _id: string;

  @Prop({ description: 'The title of the rule' })
  title: string;

  @Prop({ required: true, description: 'The filename of the JSON file containing the rule' })
  goRulesJSONFilename: string;

  @Prop({ description: 'The ID of the form in Chefs that corresponds to this rule' })
  chefsFormId: string;
}

export const RuleDataSchema = SchemaFactory.createForClass(RuleData);
