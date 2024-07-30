import { Controller, Get, Param, Post, Body, Put, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { RuleDataService } from './ruleData.service';
import { RuleData } from './ruleData.schema';
import { RuleDraft } from './ruleDraft.schema';

@Controller('api/ruleData')
export class RuleDataController {
  constructor(private readonly ruleDataService: RuleDataService) {}

  @Get('/list')
  async getAllRulesData(): Promise<RuleData[]> {
    try {
      return await this.ruleDataService.getAllRuleData();
    } catch (error) {
      throw new HttpException('Error getting list of rule data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('/draft/:ruleId')
  async getRuleDraft(@Param('ruleId') ruleId: string): Promise<RuleDraft> {
    try {
      return await this.ruleDataService.getRuleDataWithDraft(ruleId);
    } catch (error) {
      throw new HttpException('Error getting draft data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('/:ruleId')
  async getRuleData(@Param('ruleId') ruleId: string): Promise<RuleData> {
    try {
      return await this.ruleDataService.getRuleData(ruleId);
    } catch (error) {
      throw new HttpException('Error getting rule data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  async createRuleData(@Body() ruleData: RuleData): Promise<RuleData> {
    try {
      return await this.ruleDataService.createRuleData(ruleData);
    } catch (error) {
      throw new HttpException('Error creating rule data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('/:ruleId')
  async updateRuleData(@Param('ruleId') ruleId: string, @Body() ruleData: RuleData): Promise<RuleData> {
    try {
      return await this.ruleDataService.updateRuleData(ruleId, ruleData);
    } catch (error) {
      throw new HttpException('Error updating rule data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('/:ruleId')
  async deleteRuleData(@Param('ruleId') ruleId: string): Promise<void> {
    try {
      await this.ruleDataService.deleteRuleData(ruleId);
    } catch (error) {
      throw new HttpException('Error deleting rule data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
