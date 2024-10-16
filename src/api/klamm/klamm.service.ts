import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import axios, { AxiosInstance } from 'axios';
import { KlammField, KlammRulePayload, KlammRule } from './klamm';
import { deriveNameFromFilepath } from '../../utils/helpers';
import { RuleDataService } from '../ruleData/ruleData.service';
import { RuleMappingService } from '../ruleMapping/ruleMapping.service';
import { RuleData } from '../ruleData/ruleData.schema';
import { DocumentsService } from '../documents/documents.service';
import { KlammSyncMetadata, KlammSyncMetadataDocument } from './klammSyncMetadata.schema';

export const GITHUB_RULES_REPO = 'https://api.github.com/repos/bcgov/brms-rules';

export class InvalidFieldRequest extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidFieldRequestError';
  }
}

@Injectable()
export class KlammService {
  axiosKlammInstance: AxiosInstance;
  axiosGithubInstance: AxiosInstance;

  constructor(
    private readonly ruleDataService: RuleDataService,
    private readonly ruleMappingService: RuleMappingService,
    private readonly documentsService: DocumentsService,
    @InjectModel(KlammSyncMetadata.name) private klammSyncMetadata: Model<KlammSyncMetadataDocument>,
  ) {
    this.axiosKlammInstance = axios.create({
      headers: { Authorization: `Bearer ${process.env.KLAMM_API_AUTH_TOKEN}`, 'Content-Type': 'application/json' },
    });
    const headers: Record<string, string> = {};
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    this.axiosGithubInstance = axios.create({ headers });
  }

  async onModuleInit() {
    try {
      console.info('Syncing existing rules with Klamm...');
      const updatedFilesSinceLastDeploy = await this._getUpdatedFilesFromGithub();
      console.info('Files updated since last deploy:', updatedFilesSinceLastDeploy);
      await this._syncRules(updatedFilesSinceLastDeploy);
      console.info('Completed syncing existing rules with Klamm');
      await this._updateLastSyncTimestamp();
    } catch (error) {
      console.error('Unable to sync latest updates to Klamm:', error.message);
    }
  }

  async getKlammBREFields(searchText: string): Promise<string[]> {
    try {
      const sanitizedSearchText = encodeURIComponent(searchText.trim());
      const { data } = await this.axiosKlammInstance.get(
        `${process.env.KLAMM_API_URL}/api/brefields?search=${sanitizedSearchText}`,
      );
      return data;
    } catch (err) {
      throw new HttpException('Error fetching from Klamm', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getKlammBREFieldFromName(fieldName: string): Promise<KlammField[]> {
    try {
      const sanitizedFieldName = encodeURIComponent(fieldName.trim());
      const { data } = await this.axiosKlammInstance.get(`${process.env.KLAMM_API_URL}/api/brefields`, {
        params: { name: sanitizedFieldName },
      });
      if (!data?.data || data.data.length < 1) {
        throw new InvalidFieldRequest('Field name does not exist');
      }
      // Just gets first instance of a field - we shouldn't have multiple with the same name, although ideally we would make sure of that
      return data.data[0];
    } catch (error) {
      if (error instanceof InvalidFieldRequest) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException('Error fetching from Klamm', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async _syncRules(updatedFiles: string[]): Promise<void> {
    for (const ruleFilepath of updatedFiles) {
      try {
        const rule = await this.ruleDataService.getRuleDataByFilepath(ruleFilepath);
        if (rule) {
          await this._syncRuleWithKlamm(rule);
          console.info(`Rule ${rule.name} synced`);
        } else {
          console.warn(`No rule found for changed file: ${ruleFilepath}`);
        }
      } catch (error) {
        console.error(`Failed to sync rule from file ${ruleFilepath}:`, error.message);
        throw new Error(`Failed to sync rule from file ${ruleFilepath}`);
      }
    }
  }

  async _getUpdatedFilesFromGithub(): Promise<string[]> {
    try {
      // Get last updated time from from db
      const timestamp = await this._getLastSyncTimestamp();
      const date = new Date(timestamp);
      const formattedDate = date.toISOString().split('.')[0] + 'Z'; // Format required for github api
      // Fetch commits since the specified timestamp
      const commitsResponse = await this.axiosGithubInstance.get(
        `${GITHUB_RULES_REPO}/commits?since=${formattedDate}&sha=${process.env.GITHUB_RULES_BRANCH}`,
      );
      const commits = commitsResponse.data;
      // Fetch details for each commit to get the list of changed files
      const updatedFiles = new Set<string>();
      for (const commit of commits) {
        const commitDetailsResponse = await this.axiosGithubInstance.get(commit.url);
        const commitDetails = commitDetailsResponse.data;
        if (commitDetails.files) {
          for (const file of commitDetails.files) {
            if (file.filename.startsWith('rules/')) {
              updatedFiles.add(file.filename.replace(/^rules\//, ''));
            }
          }
        }
      }
      return Array.from(updatedFiles);
    } catch (error) {
      console.error('Error fetching updated files from GitHub:', error);
      throw new Error('Error fetching updated files from GitHub');
    }
  }

  async _syncRuleWithKlamm(rule: RuleData) {
    try {
      // Get the inputs and outputs for the rule
      const { inputs, outputs } = await this._getInputOutputFieldsData(rule);
      // Get child rules of the rule
      const childRules = await this._getChildRules(rule);
      // Configure payload to add or update
      const payloadToAddOrUpdate = {
        name: rule.name,
        label: rule.title,
        rule_inputs: inputs,
        rule_outputs: outputs,
        child_rules: childRules,
      };
      // Add or update the rule in Klamm
      await this._addOrUpdateRuleInKlamm(payloadToAddOrUpdate);
    } catch (error) {
      console.error(`Error syncing ${rule.name}`, error.message);
      throw new Error(`Error syncing ${rule.name}`);
    }
  }

  async _getInputOutputFieldsData(rule: RuleData): Promise<{ inputs: KlammField[]; outputs: KlammField[] }> {
    try {
      const { inputs, resultOutputs } = await this.ruleMappingService.inputOutputSchemaFile(rule.filepath);
      const inputIds = inputs.map(({ id }) => Number(id));
      const outputIds = resultOutputs.map(({ id }) => Number(id));
      const inputResults = await this._getFieldsFromIds(inputIds);
      const outputResults = await this._getFieldsFromIds(outputIds);
      return { inputs: inputResults, outputs: outputResults };
    } catch (error) {
      console.error(`Error getting input/output fields for rule ${rule.name}`, error.message);
      throw new Error(`Error getting input/output fields for rule ${rule.name}`);
    }
  }

  async _getFieldsFromIds(ids: number[]): Promise<any[]> {
    try {
      const promises = ids.map((id) => this._fetchFieldById(id));
      return await Promise.all(promises);
    } catch (error) {
      console.error(`Error fetching fields by IDs`, error.message);
      throw new Error(`Error fetching fields by IDs: ${error.message}`);
    }
  }

  private async _fetchFieldById(id: number): Promise<any> {
    try {
      const response = await this.axiosKlammInstance.get(`${process.env.KLAMM_API_URL}/api/brerules/${id}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.warn(`Field with ID ${id} not found`);
        return null;
      } else {
        console.error(`Error fetching field with ID ${id}`, error.message);
        throw new Error(`Error fetching field with ID ${id}: ${error.message}`);
      }
    }
  }

  async _getChildRules(rule: RuleData) {
    try {
      const fileContent = await this.documentsService.getFileContent(rule.filepath);
      const ruleContent = JSON.parse(fileContent.toString());
      const childNodeNames: string[] = ruleContent.nodes
        .filter(({ type, content }) => type === 'decisionNode' && content?.key)
        .map(({ content: { key } }) => deriveNameFromFilepath(key));
      const promises = childNodeNames.map((childNodeName) => this._getKlammRuleFromName(childNodeName));
      const results = await Promise.all(promises);
      return results.map((response) => response);
    } catch (error) {
      console.error(`Error gettting child rules for ${rule.name}:`, error.message);
      throw new Error(`Error gettting child rules for ${rule.name}`);
    }
  }

  async _addOrUpdateRuleInKlamm(rulePayload: KlammRulePayload) {
    // Check if rule exists already and update it if it does, add it if it doesn't
    const existingRule = await this._getKlammRuleFromName(rulePayload.name);
    if (existingRule) {
      this._updateRuleInKlamm(existingRule.id, rulePayload);
    } else {
      this._addRuleInKlamm(rulePayload);
    }
  }

  async _getKlammRuleFromName(ruleName: string): Promise<KlammRule> {
    try {
      const { data } = await this.axiosKlammInstance.get(`${process.env.KLAMM_API_URL}/api/brerules`, {
        params: { name: ruleName },
      });
      return data.data[0];
    } catch (error) {
      console.error(`Error getting rule ${ruleName} from Klamm:`, error.message);
      throw new Error(`Error getting rule ${ruleName} from Klamm`);
    }
  }

  async _addRuleInKlamm(rulePayload: KlammRulePayload) {
    try {
      await this.axiosKlammInstance.post(`${process.env.KLAMM_API_URL}/api/brerules`, rulePayload);
    } catch (error) {
      console.error('Error adding rule to Klamm:', error.message);
      throw new Error('Error adding rule to Klamm');
    }
  }

  async _updateRuleInKlamm(currentKlamRuleId: number, rulePayload: KlammRulePayload) {
    try {
      await this.axiosKlammInstance.put(`${process.env.KLAMM_API_URL}/api/brerules/${currentKlamRuleId}`, rulePayload);
    } catch (error) {
      console.error(`Error updating rule ${currentKlamRuleId} in Klamm:`, error.message);
      throw new Error(`Error updating rule ${currentKlamRuleId} in Klamm`);
    }
  }

  async _updateLastSyncTimestamp(): Promise<void> {
    try {
      const timestamp = Date.now();
      await this.klammSyncMetadata.findOneAndUpdate(
        { key: 'singleton' },
        { lastSyncTimestamp: timestamp },
        { upsert: true, new: true },
      );
    } catch (error) {
      console.error('Failed to update last sync timestamp', error.message);
      throw new Error('Failed to update last sync timestamp');
    }
  }

  private async _getLastSyncTimestamp(): Promise<number> {
    try {
      const record = await this.klammSyncMetadata.findOne({ key: 'singleton' });
      return record ? record.lastSyncTimestamp : 0;
    } catch (error) {
      console.error('Failed to get last sync timestamp:', error.message);
      throw new Error('Failed to get last sync timestamp');
    }
  }
}
