import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RuleDraftDocument } from './ruleDraft.schema';

@Schema()
export class RuleData {
  @Prop({ required: true, description: 'The GoRules ID' })
  _id: string;

  @Prop({ description: 'The title of the rule' })
  title: string;

  @Prop({ required: true, description: 'The filename of the JSON file containing the rule' })
  goRulesJSONFilename: string;

  @Prop({ type: Types.ObjectId, description: 'Draft of updated rule content', ref: 'RuleDraft' })
  ruleDraft?: RuleDraftDocument | Types.ObjectId;

  @Prop({ description: 'The name of the branch on github associated with this file' })
  reviewBranch?: string;
}

export type RuleDataDocument = RuleData & Document;

export const RuleDataSchema = SchemaFactory.createForClass(RuleData);
