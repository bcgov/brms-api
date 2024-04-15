import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Submission } from './submission.interface'; // assuming you have this interface

@Injectable()
export class SubmissionsService {
  chefsAPIURL: string;
  axiosCHEFSInstance: AxiosInstance;

  constructor(private configService: ConfigService) {
    this.chefsAPIURL = this.configService.get('CHEFS_API_URL');

    const chefsAuth = this.configService.get('CHEFS_AUTH') || 'default_auth';

    if (!this.chefsAPIURL || !chefsAuth) {
      throw new InternalServerErrorException('Environment variables CHEFS_API_URL or CHEFS_AUTH are not set');
    }

    this.axiosCHEFSInstance = axios.create({
      headers: {
        Authorization: `Basic ${chefsAuth}`,
      },
    });
  }

  async getSubmissions(formId: string): Promise<Submission[]> {
    try {
      const { data } = await this.axiosCHEFSInstance.get(`${this.chefsAPIURL}/forms/${formId}/submissions`);
      return data;
    } catch (error) {
      throw new Error(`Error getting submissions: ${error.message}`);
    }
  }

  async getSubmissionById(id: string): Promise<Submission> {
    try {
      const { data } = await this.axiosCHEFSInstance.get(`${this.chefsAPIURL}/submissions/${id}`);
      return data;
    } catch (error) {
      throw new Error(`Error getting submission by id: ${error.message}`);
    }
  }
}
