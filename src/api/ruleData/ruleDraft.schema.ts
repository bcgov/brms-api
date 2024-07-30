import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class RuleDraft {
  @Prop({ type: MongooseSchema.Types.Mixed, description: 'Draft of updated rule content' })
  content: object;
}

export type RuleDraftDocument = RuleDraft & Document;

export const RuleDraftSchema = SchemaFactory.createForClass(RuleDraft);
