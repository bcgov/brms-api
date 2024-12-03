import { Module, Logger } from '@nestjs/common';
import { ICMIntegrationController } from './icmIntegration.controller';
import { ICMIntegrationService } from './icmIntegration.service';

@Module({
  controllers: [ICMIntegrationController],
  providers: [ICMIntegrationService, Logger],
})
export class ICMIntegrationModule {}
