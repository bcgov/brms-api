import { Controller, Get, Req, Param, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ICMIntegrationService } from './icmIntegration.service';

@Controller('api/icmIntegration')
export class ICMIntegrationController {
  constructor(private readonly icmIntegrationService: ICMIntegrationService) {}

  @Get('/getRefreshToken/:refreshToken')
  async getRefreshToken(@Param('refreshToken') refreshToken: string) {
    return this.icmIntegrationService.refreshToken(refreshToken);
  }

  @Get('*')
  async callAPI(@Req() request: Request, @Query('identityToken') identityToken, @Res() response: Response) {
    const fullUrl = request.url.replace('/api/icmIntegration/', '');
    try {
      const result = await this.icmIntegrationService.callAPI(fullUrl, identityToken);
      return response.json(result);
    } catch (error) {
      throw new HttpException('Failed to call API', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
