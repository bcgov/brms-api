import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentsService } from '../documents/documents.service';
import { RuleData, RuleDataDocument } from './ruleData.schema';
import { RuleDraft, RuleDraftDocument } from './ruleDraft.schema';

@Injectable()
export class RuleDataService {
  constructor(
    @InjectModel(RuleData.name) private ruleDataModel: Model<RuleDataDocument>,
    @InjectModel(RuleDraft.name) private ruleDraftModel: Model<RuleDraftDocument>,
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

  async getRuleDataWithDraft(ruleId: string): Promise<RuleDraft> {
    try {
      const { ruleDraft } = await this.ruleDataModel.findById(ruleId).populate('ruleDraft').exec();
      return ruleDraft as RuleDraft;
    } catch (error) {
      throw new Error(`Error getting draft for ${ruleId}: ${error.message}`);
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
      throw new Error(`Error getting all rule data for ${ruleId}: ${error.message}`);
    }
  }

  async _addOrUpdateDraft(ruleData: Partial<RuleData>): Promise<Partial<RuleData>> {
    // If there is a rule draft, update that document specifically
    // This is necessary because we don't store the draft on the ruleData object directly
    // Instead it is stored elsewhere and linked to the ruleData via its id
    if (ruleData?.ruleDraft) {
      const newDraft = new this.ruleDraftModel(ruleData.ruleDraft);
      const savedDraft = await newDraft.save();
      ruleData.ruleDraft = savedDraft._id;
    }
    return ruleData;
  }

  async createRuleData(ruleData: Partial<RuleData>): Promise<RuleData> {
    try {
      if (!ruleData._id) {
        const newRuleID = new ObjectId();
        ruleData._id = newRuleID.toHexString();
      }
      ruleData = await this._addOrUpdateDraft(ruleData);
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
      updatedData = await this._addOrUpdateDraft(updatedData);
      Object.assign(existingRuleData, updatedData);
      return await existingRuleData.save();
    } catch (error) {
      console.error('Error updating rule', error.message);
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
