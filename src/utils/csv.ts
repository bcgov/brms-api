import * as csvParser from 'csv-parser';
import { formatValue } from './helpers';
import { Variable } from '../api/scenarioData/scenarioData.schema';

/**
 * Parses CSV file to an array of arrays
 * @param file csv file
 * @returns array of arrays
 */
export const parseCSV = async (file: Express.Multer.File | undefined): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    const results: string[][] = [];
    const stream = csvParser({ headers: false });

    stream.on('data', (data) => results.push(Object.values(data)));
    stream.on('end', () => resolve(results));
    stream.on('error', (error) => reject(error));

    stream.write(file.buffer);
    stream.end();
  });
};

/**
 * Extracts keys from headers based on a given prefix.
 * @param headers The CSV headers.
 * @param prefix The prefix to filter and remove from headers.
 * @returns An array of extracted keys.
 */
export const extractKeys = (headers: string[], prefix: string): string[] => {
  return headers.filter((header) => header.startsWith(prefix)).map((header) => header.replace(prefix, ''));
};

/**
 * Formats the variables from a CSV row based on provided keys.
 * @param row The CSV row data.
 * @param keys The keys to extract values for.
 * @param startIndex The start index in the row to begin extraction.
 * @param filterEmpty Whether to filter out empty values.
 * @returns An array of formatted variables.
 */
export const formatVariables = (row: string[], keys: string[], startIndex: number, filterEmpty = false): Variable[] => {
  return keys
    .map((key, index) => {
      const value = row[startIndex + index] ? formatValue(row[startIndex + index]) : null;
      if (filterEmpty && (value === null || value === undefined || value === '')) {
        return undefined;
      }
      return {
        name: key,
        value: value,
        type: typeof value,
      };
    })
    .filter((entry) => entry !== undefined);
};
