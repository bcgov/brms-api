import { Module } from '@nestjs/common';
import { RuleMappingController } from './ruleMapping.controller';
import { RuleMappingService } from './ruleMapping.service';
import { DocumentsService } from '../documents/documents.service';

@Module({
  controllers: [RuleMappingController],
  providers: [RuleMappingService, DocumentsService],
  exports: [RuleMappingService],
})
export class RuleMappingModule {}
