import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as util from 'util';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class DocumentsService {
  rulesDirectory: string;

  constructor(private configService: ConfigService) {
    this.rulesDirectory = this.configService.get<string>('RULES_DIRECTORY');
  }

  private readFile = util.promisify(fs.readFile);

  // Go through the rules directory and return a list of all JSON files
  async getAllJSONFiles(directory: string = this.rulesDirectory): Promise<string[]> {
    const jsonFiles: string[] = [];

    async function readDirectory(dir: string, baseDir: string) {
      const files = await fsPromises.readdir(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        const relativePath = path.relative(baseDir, fullPath);
        if (file.isDirectory()) {
          await readDirectory(fullPath, baseDir); // Recurse into subdirectory
        } else if (path.extname(file.name).toLowerCase() === '.json') {
          jsonFiles.push(relativePath);
        }
      }
    }

    try {
      await readDirectory(directory, directory);
      return jsonFiles;
    } catch (err) {
      throw new HttpException('Error reading directory', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get the content of a specific JSON file
  async getFileContent(ruleFileName: string): Promise<Buffer> {
    const filePath = `${this.rulesDirectory}/${ruleFileName}`;
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
