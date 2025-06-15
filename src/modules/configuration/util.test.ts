import 'reflect-metadata';

import { beforeEach, describe, expect, jest, test } from '@jest/globals';

import { asMock } from '../../test/util';
import { lazy } from '../shared';

import { getEnv, setDefaultEnvVar, transformNumber } from './util';

jest.mock('../shared', () => ({
  ...(<object>jest.requireActual('../shared')),
  __esModule: true,
  lazy: jest.fn((fn) => fn),
}));

describe('Configuration Util', () => {
  beforeEach(() => {
    asMock(lazy).mockImplementation((fn) => fn);
  });

  describe('getEnv', () => {
    test('should return the value of the environment variable', () => {
      // arrange
      process.env.KEY = 'value';

      // act
      const result = getEnv('KEY');

      // assert
      expect(result).toBe('value');
    });

    test('should return undefined if the environment variable is not set', () => {
      // arrange

      // act
      const result = getEnv('NON_EXISTENT_KEY');

      // assert
      expect(result).toBeUndefined();
    });
  });

  describe('setDefaultEnvVar', () => {
    test('should set the environment variable if not already set', () => {
      // arrange
      delete process.env.KEY;

      // act
      setDefaultEnvVar('KEY', 'value');

      // assert
      expect(process.env.KEY).toBe('value');
    });

    test('should not overwrite an existing environment variable', () => {
      // arrange
      process.env.KEY = 'existing_value';

      // act
      setDefaultEnvVar('KEY', 'new_value');

      // assert
      expect(process.env.KEY).toBe('existing_value');
    });
  });

  describe('transformNumber', () => {
    test('should transform valid string to number', () => {
      // arrange
      const envKey = 'NIBSS_TIMEOUT';
      const value = '3000';

      // act
      const result = transformNumber(envKey, value);

      // assert
      expect(result).toBe(3000);
    });

    test('should throw an error if value is null or undefined', () => {
      // arrange
      const envKey = 'NIBSS_TIMEOUT';

      // act & assert
      expect(() => transformNumber(envKey, null)).toThrow(`${envKey} is not set`);
      expect(() => transformNumber(envKey, undefined)).toThrow(`${envKey} is not set`);
    });

    test('should throw an error if value is not a number', () => {
      // arrange
      const envKey = 'NIBSS_TIMEOUT';
      const value = 'invalid-number';

      // act & assert
      expect(() => transformNumber(envKey, value)).toThrow(`${envKey} is not a number`);
    });
  });
});
