import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentsService } from '../documents/documents.service';
import { RuleData, RuleDataDocument } from './ruleData.schema';

@Injectable()
export class RuleDataService {
  constructor(
    @InjectModel(RuleData.name) private ruleDataModel: Model<RuleDataDocument>,
    private documentsService: DocumentsService,
  ) {}

  async onModuleInit() {
    console.info('Syncing existing rules with any updates to the rules repository');
    this.addUnsyncedFiles();
  }

  async getAllRuleData(): Promise<RuleData[]> {
    try {
      const ruleDataList = await this.ruleDataModel.find().exec();
      return ruleDataList;
    } catch (error) {
      throw new Error(`Error getting all rule data: ${error.message}`);
    }
  }

  async getRuleData(ruleId: string): Promise<RuleData> {
    try {
      const ruleData = await this.ruleDataModel.findOne({ _id: ruleId }).exec();
      if (!ruleData) {
        throw new Error('Rule data not found');
      }
      return ruleData;
    } catch (error) {
      throw new Error(`Error getting all rule data: ${error.message}`);
    }
  }

  async createRuleData(ruleData: Partial<RuleData>): Promise<RuleData> {
    try {
      if (!ruleData._id) {
        const newRuleID = new ObjectId();
        ruleData._id = newRuleID.toHexString();
      }
      const newRuleData = new this.ruleDataModel(ruleData);
      const response = await newRuleData.save();
      return response;
    } catch (error) {
      console.error(error.message);
      throw new Error(`Failed to add rule data: ${error.message}`);
    }
  }

  async updateRuleData(ruleId: string, updatedData: Partial<RuleData>): Promise<RuleData> {
    try {
      const existingRuleData = await this.ruleDataModel.findOne({ _id: ruleId }).exec();
      if (!existingRuleData) {
        throw new Error('Rule data not found');
      }
      Object.assign(existingRuleData, updatedData);
      return await existingRuleData.save();
    } catch (error) {
      throw new Error(`Failed to update rule data: ${error.message}`);
    }
  }

  async deleteRuleData(ruleId: string): Promise<void> {
    try {
      const deletedRuleData = await this.ruleDataModel.findOneAndDelete({ _id: ruleId }).exec();
      if (!deletedRuleData) {
        throw new Error('Rule data not found');
      }
    } catch (error) {
      throw new Error(`Failed to delete rule data: ${error.message}`);
    }
  }

  /**
   * Add rules to the db that exist in the repo, but not yet the db
   */
  async addUnsyncedFiles() {
    const existingRules = await this.getAllRuleData();
    const jsonRuleDocuments = await this.documentsService.getAllJSONFiles();
    // Find rules not yet defined in db (but with an exisitng JSON file) and add them
    jsonRuleDocuments
      .filter((goRulesJSONFilename: string) => {
        return !existingRules.find((rule) => rule.goRulesJSONFilename === goRulesJSONFilename);
      })
      .forEach((goRulesJSONFilename: string) => {
        this.createRuleData({ goRulesJSONFilename });
      });
  }
}
