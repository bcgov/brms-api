import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RuleData, RuleDataDocument } from './ruleData.schema';

@Injectable()
export class RuleDataService {
  constructor(@InjectModel(RuleData.name) private ruleDataModel: Model<RuleDataDocument>) {}

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

  async createRuleData(ruleData: RuleData): Promise<RuleData> {
    try {
      if (!ruleData._id) {
        ruleData._id = new Date().getTime().toString();
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

  async getFormAPIKeyForFormId(chefsFormId: string): Promise<string> {
    const ruleData = await this.ruleDataModel.findOne({ chefsFormId }).exec();
    if (!ruleData) {
      throw new Error(`Rule data not found for CHEFS form id: ${chefsFormId}`);
    }
    return ruleData.chefsFormAPIKey;
  }
}
