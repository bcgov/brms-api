import { complexCartesianProduct, generateCombinationsWithLimit } from './csv';

describe('CSV Utility Functions', () => {
  describe('complexCartesianProduct', () => {
    it('should generate correct combinations for simple input', () => {
      const input = [
        [1, 2],
        ['a', 'b'],
      ];
      const result = complexCartesianProduct<number | string>(input);
      expect(result).toEqual([
        [1, 'a'],
        [1, 'b'],
        [2, 'a'],
        [2, 'b'],
      ]);
    });

    it('should respect the limit parameter', () => {
      const input = [
        [1, 2, 3],
        ['a', 'b', 'c'],
        [true, false],
      ];
      const result = complexCartesianProduct<number | string | boolean>(input, 5);
      expect(result.length).toBe(5);
    });

    it('should handle empty input arrays', () => {
      const input: any[][] = [];
      const result = complexCartesianProduct(input);
      expect(result).toEqual([]);
    });

    it('should handle input with empty sub-arrays', () => {
      const input = [[1, 2], ['a', 'b'], []];
      const result = complexCartesianProduct<number | string>(input);
      expect(result).toEqual([
        [1, 'a'],
        [1, 'b'],
        [2, 'a'],
        [2, 'b'],
      ]);
    });

    it('should handle large input without exceeding memory limits', () => {
      const largeInput = Array(10).fill([1, 2, 3, 4, 5]);
      const result = complexCartesianProduct<number>(largeInput, 1000000);
      expect(result.length).toBe(1000000);
    });
  });

  describe('generateCombinationsWithLimit', () => {
    it('should generate all combinations for a small input', () => {
      const input = ['a', 'b', 'c'];
      const result = generateCombinationsWithLimit(input);
      const expectedResult = [['a'], ['a', 'b'], ['a', 'b', 'c'], ['a', 'c'], ['b'], ['b', 'c'], ['c']];
      expect(result).toEqual(expectedResult);
    });

    it('should respect the limit parameter', () => {
      const input = ['a', 'b', 'c', 'd', 'e'];
      const result = generateCombinationsWithLimit(input, 10);
      expect(result.length).toBe(10);
    });

    it('should handle empty input array', () => {
      const input: string[] = [];
      const result = generateCombinationsWithLimit(input);
      expect(result).toEqual([]);
    });

    it('should handle single element input array', () => {
      const input = ['a'];
      const result = generateCombinationsWithLimit(input);
      expect(result).toEqual([['a']]);
    });

    it('should handle large input without exceeding memory limits', () => {
      const largeInput = Array(20)
        .fill(0)
        .map((_, i) => String.fromCharCode(97 + i));
      const result = generateCombinationsWithLimit(largeInput, 1000000);
      expect(result.length).toBe(1000000);
    });
  });
});
