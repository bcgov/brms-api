import { Controller, Get, Query, Param } from '@nestjs/common';
import { KlammField } from './klamm';
import { KlammService } from './klamm.service';

@Controller('api/klamm')
export class KlammController {
  constructor(private readonly klammService: KlammService) {}

  @Get('/brefields')
  async getKlammBREFields(@Query('searchText') searchText: string) {
    return await this.klammService.getKlammBREFields(searchText);
  }

  @Get('/brefield/:fieldName')
  async getKlammBREFieldFromName(@Param('fieldName') fieldName: string): Promise<KlammField[]> {
    return await this.klammService.getKlammBREFieldFromName(fieldName);
  }
}
