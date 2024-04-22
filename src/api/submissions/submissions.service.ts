import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Submission } from './submission.interface'; // assuming you have this interface
import { RuleDataService } from '../ruleData/ruleData.service';

@Injectable()
export class SubmissionsService {
  chefsAPIURL: string;

  constructor(
    private configService: ConfigService,
    private readonly ruleDataService: RuleDataService,
  ) {
    this.chefsAPIURL = this.configService.get('CHEFS_API_URL');

    if (!this.chefsAPIURL) {
      throw new InternalServerErrorException('Environment variables CHEFS_API_URL is not not set');
    }
  }

  async getAxiosCHEFSInstance(formId: string): Promise<AxiosInstance> {
    // Get the form API key for the form
    const chefsFormAPIKey = await this.ruleDataService.getFormAPIKeyForFormId(formId);
    if (!chefsFormAPIKey) {
      throw new InternalServerErrorException('chefsFormAPIKey is not set for this CHEFS form');
    }
    // Need to convert formid and chefsFormAPIKey to base64 in order to access submissions
    const chefsAuth = Buffer.from(`${formId}:${chefsFormAPIKey}`).toString('base64');
    return axios.create({
      headers: {
        Authorization: `Basic ${chefsAuth}`,
      },
    });
  }

  async getSubmissions(formId: string): Promise<Submission[]> {
    try {
      const axiosCHEFSInstance = await this.getAxiosCHEFSInstance(formId);
      const { data } = await axiosCHEFSInstance.get(`${this.chefsAPIURL}/forms/${formId}/submissions`);
      return data;
    } catch (error) {
      throw new Error(`Error getting submissions: ${error.message}`);
    }
  }

  async getSubmissionById(formId: string, id: string): Promise<Submission> {
    try {
      const axiosCHEFSInstance = await this.getAxiosCHEFSInstance(formId);
      const { data } = await axiosCHEFSInstance.get(`${this.chefsAPIURL}/submissions/${id}`);
      return data;
    } catch (error) {
      throw new Error(`Error getting submission by id: ${error.message}`);
    }
  }
}
