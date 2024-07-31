import { Module } from '@nestjs/common';
import { GithubAuthService } from './github-auth.service';
import { GithubAuthController } from './github-auth.controller';

@Module({
  controllers: [GithubAuthController],
  providers: [GithubAuthService],
})
export class GithubAuthModule {}
