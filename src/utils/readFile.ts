import * as fs from 'fs';
import * as util from 'util';
import * as path from 'path';

export class FileNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileNotFoundError';
  }
}

const readFile = util.promisify(fs.readFile);

/**
 * Safe file reading function
 * @param rulesDirectory
 * @param ruleFileName
 * @returns buffer of the file
 */
export const readFileSafely = async (rulesDirectory: string, ruleFileName: string): Promise<Buffer> => {
  // Construct the full path safely
  const filePath = path.resolve(rulesDirectory, ruleFileName);
  // Check if the resolved path is within the intended directory
  if (!filePath.startsWith(path.resolve(rulesDirectory))) {
    throw new FileNotFoundError('Path traversal detected');
  }
  // Check if the file is found
  if (!fs.existsSync(filePath)) {
    throw new FileNotFoundError('File not found');
  }
  return await readFile(filePath);
};
