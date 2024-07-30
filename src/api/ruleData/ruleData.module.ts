import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RuleData, RuleDataSchema } from './ruleData.schema';
import { RuleDraft, RuleDraftSchema } from './ruleDraft.schema';
import { RuleDataController } from './ruleData.controller';
import { RuleDataService } from './ruleData.service';
import { DocumentsService } from '../documents/documents.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RuleData.name, schema: RuleDataSchema },
      { name: RuleDraft.name, schema: RuleDraftSchema },
    ]),
  ],
  controllers: [RuleDataController],
  providers: [RuleDataService, DocumentsService],
})
export class RuleDataModule {}
