import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubmissionsController } from './api/submissions/submissions.controller';
import { SubmissionsService } from './api/submissions/submissions.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
})
export class AppModule {}
