import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RuleData, RuleDataSchema } from './api/ruleData/ruleData.schema';
import { RuleDataController } from './api/ruleData/ruleData.controller';
import { RuleDataService } from './api/ruleData/ruleData.service';
import { DecisionsController } from './api/decisions/decisions.controller';
import { DecisionsService } from './api/decisions/decisions.service';
import { DocumentsController } from './api/documents/documents.controller';
import { DocumentsService } from './api/documents/documents.service';
import { SubmissionsController } from './api/submissions/submissions.controller';
import { SubmissionsService } from './api/submissions/submissions.service';
import { RuleMappingController } from './api/ruleMapping/ruleMapping.controller';
import { RuleMappingService } from './api/ruleMapping/ruleMapping.service';
import { ScenarioData, ScenarioDataSchema } from './api/scenarioData/scenarioData.schema';
import { ScenarioDataController } from './api/scenarioData/scenarioData.controller';
import { ScenarioDataService } from './api/scenarioData/scenarioData.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make the ConfigModule globally available
      load: [
        () => ({
          RULES_DIRECTORY: process.env.RULES_DIRECTORY || 'brms-rules/rules',
        }),
      ],
    }),
    MongooseModule.forRoot(process.env.MONGODB_URL),
    MongooseModule.forFeature([
      { name: RuleData.name, schema: RuleDataSchema },
      { name: ScenarioData.name, schema: ScenarioDataSchema },
    ]),
  ],
  controllers: [
    RuleDataController,
    DecisionsController,
    DocumentsController,
    SubmissionsController,
    RuleMappingController,
    ScenarioDataController,
  ],
  providers: [
    RuleDataService,
    DecisionsService,
    DocumentsService,
    SubmissionsService,
    RuleMappingService,
    ScenarioDataService,
  ],
})
export class AppModule {}
