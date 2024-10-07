/**
 * MIGRATION
 * This file is to migrate the RuleData property 'goRulesJSONFilename' to 'filepath'
 * If also introduces the 'name' property that is derived from the 'goRulesJSONFile'/'filePath' property
 */

import { connect, connection, model } from 'mongoose';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { RuleData } from '../api/ruleData/ruleData.schema';
import { deriveNameFromFilepath } from '../utils/helpers';

class OldRuleData extends RuleData {
  @Prop({ description: 'This has now been deprecated' })
  goRulesJSONFilename?: string;
}

export const RuleDataSchema = SchemaFactory.createForClass(OldRuleData);

const oldRuleData = model('RuleData', RuleDataSchema);

export default async function filepathMigration() {
  await connect(process.env.MONGODB_URL);

  try {
    const documents = await oldRuleData.find();

    for (const doc of documents) {
      if (!doc.filepath) {
        if (doc?.goRulesJSONFilename) {
          // Update the to have filepath and name
          doc.filepath = doc.goRulesJSONFilename;
          doc.name = deriveNameFromFilepath(doc.goRulesJSONFilename);
          doc.goRulesJSONFilename = undefined;
          await doc.save();
          console.log('Updated:', doc);
        } else {
          console.warn('WARNING: document exists without goRulesJSONFilename', doc);
        }
      }
    }

    console.log('Filepath migration completed successfully');
  } catch (error) {
    console.error('Filepath migration failed', error);
  } finally {
    connection.close();
  }
}
