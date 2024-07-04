import * as csvParser from 'csv-parser';

/**
 * Replace special characters in strings
 * @param input
 * @param replacement
 * @returns replaced string
 */
export const replaceSpecialCharacters = (input: string, replacement: string): string => {
  const specialChars = /[\n\r\t\f,]/g;
  return input.replace(specialChars, (match) => {
    if (match === ',') {
      return '-';
    }
    return replacement;
  });
};

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
 * Compares two objects for equality
 * @param obj1 first object
 * @param obj2 second object
 * @returns true if equal, false otherwise
 */

export const isEqual = (obj1: any, obj2: any) => {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || !isEqual(obj1[key], obj2[key])) return false;
  }

  return true;
};

/**
 * Reduces an array of objects to a single object with cleaned keys and values mapped
 * @param arr Array of objects to reduce
 * @param keyName Name of the key to use for the reduced object keys
 * @param valueName Name of the key to use for the reduced object values
 * @param replacement Replacement string for special characters
 * @returns Reduced and cleaned object
 */
export const reduceToCleanObj = (
  arr: { [key: string]: any }[] | undefined | null,
  keyName: string,
  valueName: string,
  replacement: string = '',
): Record<string, any> => {
  if (!Array.isArray(arr)) {
    return {};
  }

  return arr.reduce((acc: Record<string, any>, obj: { [key: string]: any }) => {
    if (obj && typeof obj === 'object') {
      const cleanedKey = replaceSpecialCharacters(obj[keyName], replacement);
      acc[cleanedKey] = obj[valueName];
    }
    return acc;
  }, {});
};

/**
 * Extracts unique keys from a specified property.
 * @param object The object to extract keys from.
 * @param property The property to extract keys from ('inputs', 'outputs', 'expectedResults', etc.).
 * @returns An array of unique keys.
 */
export const extractUniqueKeys = (object: Record<string, any>, property: string): string[] => {
  return Array.from(
    new Set(
      Object.values(object).flatMap((each) => {
        if (each[property]) {
          return Object.keys(each[property]);
        }
        return [];
      }),
    ),
  );
};
