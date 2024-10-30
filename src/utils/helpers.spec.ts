import {
  replaceSpecialCharacters,
  isEqual,
  reduceToCleanObj,
  extractUniqueKeys,
  formatValue,
  deriveNameFromFilepath,
} from './helpers';

describe('Utility Functions', () => {
  describe('replaceSpecialCharacters', () => {
    it('should replace special characters with the replacement string', () => {
      const input = 'Hello,world!';
      const replacement = '-';
      const result = replaceSpecialCharacters(input, replacement);
      expect(result).toBe('Hello-world!');
    });

    it('should replace commas with a dash', () => {
      const input = 'Hello, world!';
      const replacement = '';
      const result = replaceSpecialCharacters(input, replacement);
      expect(result).toBe('Hello- world!');
    });
  });

  describe('isEqual', () => {
    it('should return true for equal objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2 };
      const result = isEqual(obj1, obj2);
      expect(result).toBe(true);
    });

    it('should return false for non-equal objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };
      const result = isEqual(obj1, obj2);
      expect(result).toBe(false);
    });
  });

  describe('reduceToCleanObj', () => {
    it('should reduce array to cleaned object', () => {
      const arr = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
      ];
      const result = reduceToCleanObj(arr, 'key', 'value', '-');
      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should handle null or undefined input array', () => {
      const result = reduceToCleanObj(null, 'key', 'value', '-');
      expect(result).toEqual({});
    });
  });

  describe('extractUniqueKeys', () => {
    it('should extract unique keys from specified property', () => {
      const object = {
        a: { inputs: { key1: 'value1', key2: 'value2' } },
        b: { inputs: { key3: 'value3' } },
      };
      const result = extractUniqueKeys(object, 'inputs');
      expect(result).toEqual(['key1', 'key2', 'key3']);
    });
  });

  describe('formatValue', () => {
    it('should format true/false strings to boolean', () => {
      expect(formatValue('true')).toBe(true);
      expect(formatValue('false')).toBe(false);
    });

    it('should return the value if it matches the date format', () => {
      const date = '2021-09-15';
      expect(formatValue(date)).toBe(date);
    });

    it('should format numeric strings to numbers', () => {
      expect(formatValue('42')).toBe(42);
    });

    it('should return null for empty strings', () => {
      expect(formatValue('')).toBeNull();
    });

    it('should return the original string if no conditions match', () => {
      const str = 'hello';
      expect(formatValue(str)).toBe(str);
    });
  });

  describe('deriveNameFromFilepath', () => {
    it('should derive the name from the filepath', () => {
      const filepath = '/path/to/file.json';
      const result = deriveNameFromFilepath(filepath);
      expect(result).toBe('file');
    });
  });
});
