import { describe, expect, jest, test } from '@jest/globals';

import { lazy } from './util';

describe('shared/util', () => {
  describe('lazy', () => {
    test('should call the factory function only once', () => {
      // arrange
      const factory = jest.fn(() => 'value');
      const lazyValue = lazy(factory);

      // act
      lazyValue();
      lazyValue();

      // assert
      expect(factory).toHaveBeenCalledTimes(1);
    });

    test('should return the value from the factory function', () => {
      // arrange
      const factory = jest.fn(() => 'value');
      const lazyValue = lazy(factory);

      // act
      const result = lazyValue();

      // assert
      expect(result).toBe('value');
    });
  });
});
