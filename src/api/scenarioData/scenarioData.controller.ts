import { Controller, Get, Param, Post, Body, Put, Delete, HttpException, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { ScenarioDataService } from './scenarioData.service';
import { ScenarioData } from './scenarioData.schema';

@Controller('api/scenario')
export class ScenarioDataController {
  constructor(private readonly scenarioDataService: ScenarioDataService) {}

  @Get('/list')
  async getAllScenarioData(): Promise<ScenarioData[]> {
    try {
      return await this.scenarioDataService.getAllScenarioData();
    } catch (error) {
      throw new HttpException('Error getting all scenario data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('/by-rule/:ruleId')
  async getScenariosByRuleId(@Param('ruleId') ruleId: string): Promise<ScenarioData[]> {
    try {
      return await this.scenarioDataService.getScenariosByRuleId(ruleId);
    } catch (error) {
      throw new HttpException('Error getting scenarios by rule ID', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('/by-filename/:goRulesJSONFilename')
  async getScenariosByFilename(@Param('goRulesJSONFilename') goRulesJSONFilename: string): Promise<ScenarioData[]> {
    try {
      return await this.scenarioDataService.getScenariosByFilename(goRulesJSONFilename);
    } catch (error) {
      throw new HttpException('Error getting scenarios by filename', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('/:scenarioId')
  async getScenarioData(@Param('scenarioId') scenarioId: string): Promise<ScenarioData> {
    try {
      return await this.scenarioDataService.getScenarioData(scenarioId);
    } catch (error) {
      throw new HttpException('Error getting scenario data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  async createScenarioData(@Body() scenarioData: ScenarioData): Promise<ScenarioData> {
    try {
      return await this.scenarioDataService.createScenarioData(scenarioData);
    } catch (error) {
      throw new HttpException('Error creating scenario data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('/:scenarioId')
  async updateScenarioData(
    @Param('scenarioId') scenarioId: string,
    @Body() scenarioData: ScenarioData,
  ): Promise<ScenarioData> {
    try {
      return await this.scenarioDataService.updateScenarioData(scenarioId, scenarioData);
    } catch (error) {
      throw new HttpException('Error updating scenario data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('/:scenarioId')
  async deleteScenarioData(@Param('scenarioId') scenarioId: string): Promise<void> {
    try {
      await this.scenarioDataService.deleteScenarioData(scenarioId);
    } catch (error) {
      throw new HttpException('Error deleting scenario data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('/evaluation/:goRulesJSONFilename')
  async getCSVForRuleRun(@Param('goRulesJSONFilename') goRulesJSONFilename: string, @Res() res: Response) {
    const fileContent = await this.scenarioDataService.getCSVForRuleRun(goRulesJSONFilename);
    try {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${goRulesJSONFilename.replace(/\.json$/, '.csv')}`);
      res.status(HttpStatus.OK).send(fileContent);
    } catch (error) {
      throw new HttpException('Error generating CSV for rule run', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
