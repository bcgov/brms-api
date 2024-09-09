import { Controller, Get } from '@nestjs/common';
import { KlammService } from './klamm.service';

@Controller('api/klamm')
export class KlammController {
  constructor(private readonly klammService: KlammService) {}

  @Get('/brefields')
  async getBREFields() {
    return await this.klammService.getBREFields();
  }
}
