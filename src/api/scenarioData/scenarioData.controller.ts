import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  HttpException,
  HttpStatus,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ScenarioDataService } from './scenarioData.service';
import { ScenarioData } from './scenarioData.schema';
import { RuleContent } from '../ruleMapping/ruleMapping.interface';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { FileNotFoundError } from '../../utils/readFile';
import { RuleRunResults } from './scenarioData.interface';

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
      if (error instanceof FileNotFoundError) {
        throw new HttpException('Rule not found', HttpStatus.NOT_FOUND);
      } else {
        throw new HttpException('Error getting scenarios by rule ID', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  @Post('/by-filename')
  async getScenariosByFilename(@Body('goRulesJSONFilename') goRulesJSONFilename: string): Promise<ScenarioData[]> {
    try {
      return await this.scenarioDataService.getScenariosByFilename(goRulesJSONFilename);
    } catch (error) {
      if (error instanceof FileNotFoundError) {
        throw new HttpException('Rule not found', HttpStatus.NOT_FOUND);
      } else {
        throw new HttpException('Error getting scenarios by filename', HttpStatus.INTERNAL_SERVER_ERROR);
      }
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
  async createScenarioData(@Body() createScenarioDto: CreateScenarioDto): Promise<ScenarioData> {
    try {
      const scenarioData: ScenarioData = {
        title: createScenarioDto.title,
        ruleID: createScenarioDto.ruleID,
        variables: createScenarioDto.variables,
        goRulesJSONFilename: createScenarioDto.goRulesJSONFilename,
        expectedResults: createScenarioDto.expectedResults,
      };
      return await this.scenarioDataService.createScenarioData(scenarioData);
    } catch (error) {
      throw new HttpException('Error creating scenario data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('/:scenarioId')
  async updateScenarioData(
    @Param('scenarioId') scenarioId: string,
    @Body() updateScenarioDto: CreateScenarioDto,
  ): Promise<ScenarioData> {
    try {
      const scenarioData: ScenarioData = {
        title: updateScenarioDto.title,
        ruleID: updateScenarioDto.ruleID,
        variables: updateScenarioDto.variables,
        goRulesJSONFilename: updateScenarioDto.goRulesJSONFilename,
        expectedResults: updateScenarioDto.expectedResults,
      };
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

  @Post('/evaluation')
  async getCSVForRuleRun(
    @Body('goRulesJSONFilename') goRulesJSONFilename: string,
    @Body('ruleContent') ruleContent: RuleContent,
    @Res() res: Response,
  ) {
    try {
      const fileContent = await this.scenarioDataService.getCSVForRuleRun(goRulesJSONFilename, ruleContent);
      // UTF- 8 encoding with BOM
      const bom = '\uFEFF';
      const utf8FileContent = bom + fileContent;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=${goRulesJSONFilename.replace(/\.json$/, '.csv')}`);
      res.status(HttpStatus.OK).send(utf8FileContent);
    } catch (error) {
      throw new HttpException('Error generating CSV for rule run', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('/run-decisions')
  async runDecisionsForScenarios(
    @Body('goRulesJSONFilename') goRulesJSONFilename: string,
    @Body('ruleContent') ruleContent: RuleContent,
  ): Promise<{ [scenarioId: string]: any }> {
    try {
      return await this.scenarioDataService.runDecisionsForScenarios(goRulesJSONFilename, ruleContent);
    } catch (error) {
      throw new HttpException('Error running scenario decisions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('/evaluation/upload/')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCSVAndProcess(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Res() res: Response,
    @Body('goRulesJSONFilename') goRulesJSONFilename: string,
    @Body('ruleContent') ruleContent: RuleContent,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    try {
      const scenarios = await this.scenarioDataService.processProvidedScenarios(goRulesJSONFilename, file);
      const csvContent = await this.scenarioDataService.getCSVForRuleRun(goRulesJSONFilename, ruleContent, scenarios);
      // UTF- 8 encoding with BOM
      const bom = '\uFEFF';
      const utf8FileContent = bom + csvContent;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=processed_data.csv`);
      res.status(HttpStatus.OK).send(utf8FileContent);
    } catch (error) {
      throw new HttpException('Error processing CSV file', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('/test')
  async getCSVTests(
    @Body('goRulesJSONFilename') goRulesJSONFilename: string,
    @Body('ruleContent') ruleContent: RuleContent,
    @Body('simulationContext') simulationContext: RuleRunResults,
    @Body('testScenarioCount') testScenarioCount: number,
    @Res() res: Response,
  ) {
    try {
      const fileContent = await this.scenarioDataService.generateTestCSVScenarios(
        goRulesJSONFilename,
        ruleContent,
        simulationContext,
        testScenarioCount && testScenarioCount > 0 ? testScenarioCount : undefined,
      );
      // UTF- 8 encoding with BOM
      const bom = '\uFEFF';
      const utf8FileContent = bom + fileContent;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=${goRulesJSONFilename.replace(/\.json$/, '.csv')}`);
      res.status(HttpStatus.OK).send(utf8FileContent);
    } catch (error) {
      throw new HttpException('Error generating CSV for rule run', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
