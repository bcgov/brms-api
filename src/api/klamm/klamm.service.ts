import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class KlammService {
  async getBREFields(): Promise<string[]> {
    try {
      const { data } = await axios.get(`${process.env.KLAMM_API_URL}/api/brefields`, {
        headers: {
          Authorization: `Bearer ${process.env.KLAMM_API_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      return data;
    } catch (err) {
      throw new HttpException('Error fetching from Klamm', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
