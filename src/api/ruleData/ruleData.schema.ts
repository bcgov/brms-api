import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RuleDraftDocument } from './ruleDraft.schema';

@Schema()
export class RuleData {
  @Prop({ required: true, description: 'The GoRules ID' })
  _id: string;

  @Prop({ unique: true, description: 'A unique name currently derived from the filepath' })
  name: string;

  @Prop({ description: 'The title of the rule' })
  title: string;

  @Prop({ required: true, description: 'The filepath of the JSON file containing the rule' })
  filepath: string;

  @Prop({ type: Types.ObjectId, description: 'Draft of updated rule content', ref: 'RuleDraft' })
  ruleDraft?: RuleDraftDocument | Types.ObjectId;

  @Prop({ description: 'The name of the branch on github associated with this file' })
  reviewBranch?: string;

  @Prop({ description: 'If the rule has been published' })
  isPublished?: boolean;
}

export type RuleDataDocument = RuleData & Document;

export const RuleDataSchema = SchemaFactory.createForClass(RuleData);
