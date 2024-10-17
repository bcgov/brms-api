import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class KlammSyncMetadata {
  @Prop({ type: String, unique: true, default: 'singleton' }) // ensures only one copy of this document
  key: string;

  @Prop({ type: Number, description: 'Timestamp of when the rules were last synced to Klamm' })
  lastSyncTimestamp: number;
}

export type KlammSyncMetadataDocument = KlammSyncMetadata & Document;

export const KlammSyncMetadataSchema = SchemaFactory.createForClass(KlammSyncMetadata);
