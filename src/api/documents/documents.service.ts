import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as util from 'util';

@Injectable()
export class DocumentsService {
  private readFile = util.promisify(fs.readFile);

  async getFileContent(filePath: string): Promise<Buffer> {
    if (!fs.existsSync(filePath)) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }

    try {
      const fileContent = await this.readFile(filePath);
      return fileContent;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
