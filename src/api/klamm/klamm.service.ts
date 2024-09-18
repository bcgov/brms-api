import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export class InvalidFieldRequest extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidFieldRequestError';
  }
}

@Injectable()
export class KlammService {
  axiosKlammInstance: AxiosInstance;

  constructor() {
    this.axiosKlammInstance = axios.create({
      headers: { Authorization: `Bearer ${process.env.KLAMM_API_AUTH_TOKEN}`, 'Content-Type': 'application/json' },
    });
  }

  async getBREFields(searchText: string): Promise<string[]> {
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

  async getBREFieldFromName(fieldName: string): Promise<any[]> {
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
}
