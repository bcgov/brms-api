import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GithubAuthModule } from './auth/github-auth/github-auth.module';
import { RuleDataModule } from './api/ruleData/ruleData.module';
import { DecisionsController } from './api/decisions/decisions.controller';
import { DecisionsService } from './api/decisions/decisions.service';
import { DocumentsController } from './api/documents/documents.controller';
import { DocumentsService } from './api/documents/documents.service';
import { RuleMappingController } from './api/ruleMapping/ruleMapping.controller';
import { RuleMappingService } from './api/ruleMapping/ruleMapping.service';
import { ScenarioData, ScenarioDataSchema } from './api/scenarioData/scenarioData.schema';
import { ScenarioDataController } from './api/scenarioData/scenarioData.controller';
import { ScenarioDataService } from './api/scenarioData/scenarioData.service';
import { KlammController } from './api/klamm/klamm.controller';
import { KlammService } from './api/klamm/klamm.service';

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
    MongooseModule.forFeature([{ name: ScenarioData.name, schema: ScenarioDataSchema }]),
    GithubAuthModule,
    RuleDataModule,
  ],
  controllers: [
    DecisionsController,
    DocumentsController,
    RuleMappingController,
    ScenarioDataController,
    KlammController,
  ],
  providers: [DecisionsService, DocumentsService, RuleMappingService, ScenarioDataService, KlammService],
})
export class AppModule {}
