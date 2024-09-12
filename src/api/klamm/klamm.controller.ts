import { Controller, Get, Param } from '@nestjs/common';
import { KlammService } from './klamm.service';

@Controller('api/klamm')
export class KlammController {
  constructor(private readonly klammService: KlammService) {}

  @Get('/brefields')
  async getBREFields() {
    return await this.klammService.getBREFields();
  }

  @Get('/brefield/:fieldName')
  async getBREFieldFromName(@Param('fieldName') fieldName: string) {
    return await this.klammService.getBREFieldFromName(fieldName);
  }
}
