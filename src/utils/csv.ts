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
  const result: { [key: string]: any } = {};

  keys.forEach((key, index) => {
    const value = row[startIndex + index] ? formatValue(row[startIndex + index]) : null;
    if (filterEmpty && (value === null || value === undefined || value === '')) {
      return;
    }

    const parts = key.match(/^([^\[]+)(?:\[(\d+)\])?(.*)$/);
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      const valueToArray = value.slice(1, value.length - 1).split(', ');
      result[key] = valueToArray;
    } else if (parts) {
      const [, baseKey, arrayIndex, remainingKey] = parts;

      const pluralizedKey = `${baseKey}${Number(arrayIndex) > 0 ? 's' : ''}`;

      if (!result[pluralizedKey]) {
        result[pluralizedKey] = arrayIndex ? [] : {};
      }

      if (arrayIndex) {
        const idx = parseInt(arrayIndex, 10) - 1;
        if (!result[pluralizedKey][idx]) {
          result[pluralizedKey][idx] = {};
        }
        if (remainingKey) {
          result[pluralizedKey][idx][remainingKey] = value;
        } else {
          result[pluralizedKey][idx] = value;
        }
      } else if (remainingKey) {
        result[pluralizedKey][remainingKey] = value;
      } else {
        result[pluralizedKey] = value;
      }
    } else {
      result[key] = value;
    }
  });

  return Object.entries(result).map(([name, value]) => ({
    name,
    value: Array.isArray(value) ? value.filter((v) => v !== undefined) : value,
    type: Array.isArray(value) ? 'array' : typeof value,
  }));
};

/**
 * Generates a cartesian product of arrays.
 * @param arrays The arrays to generate the product from.
 * @returns The generated product.
 */
export const cartesianProduct = (arrays: any[][]): any[][] => {
  return arrays.reduce((a, b) => a.flatMap((d) => b.map((e) => [...d, e])), [[]]);
};

/**
 * Generates a cartesian product of arrays in a more memory-efficient way, with the ability to adjust the maximum number of combinations.
 * @param arrays The arrays to generate the product from.
 * @param limit The maximum number of combinations to generate.
 * @returns The generated product.
 */
export const complexCartesianProduct = (arrays: any[][], limit: number = 3000): any[][] => {
  const result: any[][] = [];
  const maxIndex = arrays.map((arr) => arr.length - 1);
  const indices = new Array(arrays.length).fill(0);

  while (indices[0] <= maxIndex[0] && result.length < limit) {
    result.push(indices.map((index, i) => arrays[i][index]));

    let currentDimension = indices.length - 1;
    while (currentDimension >= 0) {
      if (indices[currentDimension] < maxIndex[currentDimension]) {
        indices[currentDimension]++;
        break;
      } else {
        indices[currentDimension] = 0;
        currentDimension--;
      }
    }

    if (currentDimension < 0) break;
  }

  return result;
};

/**
 * Generates all combinations of a given array with varying lengths.
 * @param arr The input array to generate combinations from.
 * @param limit The maximum number of combinations to generate.
 * @returns The generated product.
 */
export const generateCombinationsWithLimit = (arr: string[], limit: number = 1000): string[][] => {
  const result: string[][] = [];

  const combine = (prefix: string[], remaining: string[], start: number) => {
    if (result.length >= limit) return; // Stop when the limit is reached
    for (let i = start; i < remaining.length; i++) {
      const newPrefix = [...prefix, remaining[i]];
      result.push(newPrefix);
      combine(newPrefix, remaining, i + 1);
    }
  };

  combine([], arr, 0);
  return result.slice(0, limit);
};
