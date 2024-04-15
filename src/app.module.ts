import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RuleData, RuleDataSchema } from './api/ruleData/ruleData.schema';
import { RuleDataController } from './api/ruleData/ruleData.controller';
import { RuleDataService } from './api/ruleData/ruleData.service';
import { SubmissionsController } from './api/submissions/submissions.controller';
import { SubmissionsService } from './api/submissions/submissions.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot('mongodb://localhost/nest'),
    MongooseModule.forFeature([{ name: RuleData.name, schema: RuleDataSchema }]), // import model
  ],
  controllers: [RuleDataController, SubmissionsController],
  providers: [RuleDataService, SubmissionsService],
})
export class AppModule {}
