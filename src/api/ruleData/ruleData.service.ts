import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { DocumentsService } from '../documents/documents.service';
import { RuleData, RuleDataDocument } from './ruleData.schema';
import { RuleDraft, RuleDraftDocument } from './ruleDraft.schema';
import { deriveNameFromFilepath } from '../../utils/helpers';

@Injectable()
export class RuleDataService {
  constructor(
    @InjectModel(RuleData.name) private ruleDataModel: Model<RuleDataDocument>,
    @InjectModel(RuleDraft.name) private ruleDraftModel: Model<RuleDraftDocument>,
    private documentsService: DocumentsService,
  ) {}

  async onModuleInit() {
    console.info('Syncing existing rules with any updates to the rules repository');
    const existingRules = await this.getAllRuleData();
    this.updateInReviewStatus(existingRules);
    this.addUnsyncedFiles(existingRules);
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

  async getRuleDataByFilepath(filepath: string): Promise<RuleData> {
    try {
      const ruleData = await this.ruleDataModel.findOne({ filepath }).exec();
      if (!ruleData) {
        throw new Error('Rule data not found');
      }
      return ruleData;
    } catch (error) {
      throw new Error(`Error getting all rule data for ${filepath}: ${error.message}`);
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
      ruleData.name = deriveNameFromFilepath(ruleData.filepath);
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
      if (updatedData.filepath) {
        updatedData.name = deriveNameFromFilepath(updatedData.filepath);
      }
      updatedData = await this._addOrUpdateDraft(updatedData);
      Object.assign(existingRuleData, updatedData);
      return await existingRuleData.save();
    } catch (error) {
      console.error('Error updating rule', error.message);
      throw new Error(`Failed to update rule data: ${error.message}`);
    }
  }

  async deleteRuleData(ruleId: string): Promise<RuleData> {
    try {
      const deletedRuleData = await this.ruleDataModel.findOneAndDelete({ _id: ruleId }).exec();
      if (!deletedRuleData) {
        throw new Error('Rule data not found');
      }
      return deletedRuleData;
    } catch (error) {
      throw new Error(`Failed to delete rule data: ${error.message}`);
    }
  }

  /**
   * Remove current reviewBranch if it no longer exists (aka review branch has been merged in and removed)
   */
  async updateInReviewStatus(existingRules: RuleData[]) {
    try {
      // Get current branches from github
      const headers: Record<string, string> = {};
      if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
      }
      const branchesResponse = await axios.get('https://api.github.com/repos/bcgov/brms-rules/branches', { headers });
      const currentBranches = branchesResponse?.data.map(({ name }) => name);
      // Remove current reviewBranch if it no longer exists
      if (currentBranches) {
        existingRules.forEach(({ _id, reviewBranch }) => {
          if (reviewBranch && !currentBranches.includes(reviewBranch)) {
            this.updateRuleData(_id, { reviewBranch: null });
          }
        });
      }
    } catch (error) {
      console.error('Error updating review status:', error.message);
    }
  }

  /**
   * Add rules to the db that exist in the repo, but not yet the db
   */
  async addUnsyncedFiles(existingRules: RuleData[]) {
    // Find rules not yet defined in db (but with an exisitng JSON file) and add them
    const jsonRuleDocuments = await this.documentsService.getAllJSONFiles();
    jsonRuleDocuments.forEach((filepath: string) => {
      const existingRule = existingRules.find((rule) => rule.filepath === filepath);
      if (!existingRule) {
        this.createRuleData({ filepath, isPublished: true });
      } else if (!existingRule.isPublished) {
        // Update status to isPublished if it isn't yet
        this.updateRuleData(existingRule._id, { isPublished: true });
      }
    });
  }
}
