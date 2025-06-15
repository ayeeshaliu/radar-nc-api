import 'reflect-metadata'; // needed when testing services
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Container } from 'typedi';

import { createMonoLogger } from '@withmono/logger';

import { asMock, getMockLogger } from '../../test/util';

import { ConfigService, getConfigService } from './config.service';
import ConfigNotFoundError from './error';

import { validateEnvVars } from './index';

jest.mock('typedi', () => {
  const originalModule = jest.requireActual('typedi') as object;
  return {
    __esModule: true,
    ...originalModule,
    Container: {
      get: jest.fn(),
    },
  };
});

jest.mock('./mapping', () => {
  const originalModule = jest.requireActual('./mapping') as object;
  const testConfigMapping = {
    serviceId: {
      env: 'SERVICE_ID',
      required: true,
    },
    isDebugMode: {
      env: 'DEBUG',
      required: false,
    },
  };
  return {
    __esModule: true,
    ...originalModule,
    configMapping: testConfigMapping,
    configValues: Object.values(testConfigMapping),
  };
});

jest.mock('@withmono/logger', () => ({
  createMonoLogger: jest.fn(),
}));

jest.mock('./util', () => {
  const originalModule = jest.requireActual('./util') as object;

  return {
    __esModule: true,
    ...originalModule,
    getEnv: jest.fn((key: string) => process.env[key]),
  };
});

describe('config.service', () => {
  beforeEach(() => {
    // Clear test environment variables before each test
    delete process.env.SERVICE_ID;
    delete process.env.DEBUG;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('ConfigService', () => {
    describe('get', () => {
      test('should return configuration with mapped name', async () => {
        // arrange
        const mockLogger = getMockLogger();
        const service = new ConfigService(mockLogger);
        const testValue = 'test';
        process.env.SERVICE_ID = testValue;

        // act
        const value = service.get('serviceId');

        // assert
        expect(value).toBe(testValue);
      });

      test('should return default value if a default is passed and the expected value is undefined', async () => {
        // arrange
        const mockLogger = getMockLogger();
        const service = new ConfigService(mockLogger);
        const testValue = 'test';
        delete process.env.SERVICE_ID;

        // act
        const value = service.get('serviceId', testValue);

        // assert
        expect(value).toBe(testValue);
      });

      test('should return null if the value does not exist', async () => {
        // arrange
        const mockLogger = getMockLogger();
        const service = new ConfigService(mockLogger);
        delete process.env.SERVICE_ID;

        // act
        const value = service.get('serviceId');

        // assert
        expect(value).toBeNull();
      });
    });

    describe('getRequired', () => {
      test('should return configuration with mapped name', async () => {
        // arrange
        const mockLogger = getMockLogger();
        const service = new ConfigService(mockLogger);
        const testValue = 'test';
        process.env.SERVICE_ID = testValue;

        // act
        const value = service.getRequired('serviceId');

        // assert
        expect(value).toBe(testValue);
      });

      test('should throw an error if the config is not defined', async () => {
        // arrange
        const mockLogger = getMockLogger();
        const service = new ConfigService(mockLogger);
        delete process.env.SERVICE_ID;

        // act and assert
        expect(() => service.getRequired('serviceId')).toThrow(ConfigNotFoundError);
      });
    });

    describe('getNamespacedKey', () => {
      test('should return a namespaced key', async () => {
        // arrange
        const mockLogger = getMockLogger();
        const service = new ConfigService(mockLogger);
        process.env.SERVICE_ID = 'test-service'; // Use consistent service ID
        const key = 'key';
        const namespace = 'namespace';

        // act
        const value = service.getNamespacedKey(key, namespace);

        // assert
        expect(value).toBe('test-service:namespace:key');
      });

      test('should return a namespaced key with the default namespace if none is provided', async () => {
        // arrange
        const mockLogger = getMockLogger();
        const service = new ConfigService(mockLogger);
        process.env.SERVICE_ID = 'test-service'; // Use consistent service ID
        const key = 'key';

        // act
        const value = service.getNamespacedKey(key);

        // assert
        expect(value).toBe('test-service:default:key');
      });
    });

    describe('isDebugMode', () => {
      test('should return true if DEBUG is true', async () => {
        // arrange
        const mockLogger = getMockLogger();
        const service = new ConfigService(mockLogger);
        process.env.DEBUG = 'true';

        // act
        const value = service.isDebugMode();

        // assert
        expect(value).toBe(true);
      });

      test("should return false if DEBUG is truthy but not 'true'", async () => {
        // arrange
        const mockLogger = getMockLogger();
        const service = new ConfigService(mockLogger);
        process.env.DEBUG = 'random content';
        const isTruthy = !!process.env.DEBUG;

        // act
        const value = service.isDebugMode();

        // assert
        expect(isTruthy).toBe(true);
        expect(value).toBe(false);
      });

      test('should return false if DEBUG is not defined', async () => {
        // arrange
        const mockLogger = getMockLogger();
        const service = new ConfigService(mockLogger);
        delete process.env.DEBUG;

        // act
        const value = service.isDebugMode();

        // assert
        expect(value).toBe(false);
      });
    });
  });

  describe('getConfigService', () => {
    test('should return a ConfigService instance from the global DI container', () => {
      // arrange
      const mockLogger = getMockLogger();
      const configService = new ConfigService(mockLogger);
      asMock(Container.get).mockReturnValue(configService);

      // act
      const value = getConfigService();

      // assert
      expect(value).toBe(configService);
    });
  });

  describe('validateRequiredEnvVars', () => {
    test('should throw an error if a required env var is missing', async () => {
      // arrange
      delete process.env.SERVICE_ID;

      // act and assert
      expect(() => validateEnvVars()).toThrow(
        'Missing or invalid required environment variables: SERVICE_ID',
      );
    });

    test('should log a warning if a non-required env var is missing', async () => {
      // arrange
      const mockLogger = getMockLogger();
      asMock(createMonoLogger).mockReturnValue(mockLogger);
      process.env.SERVICE_ID = 'test';
      delete process.env.DEBUG;

      // act
      validateEnvVars();

      // assert
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Warning: Missing or invalid environment variables: DEBUG',
      );
    });

    test('should not throw an error if all env vars are present', async () => {
      // arrange
      process.env.SERVICE_ID = 'test';
      process.env.DEBUG = 'test-debug';
      const mockLogger = getMockLogger();
      asMock(createMonoLogger).mockReturnValue(mockLogger);

      // act and assert
      expect(() => validateEnvVars()).not.toThrow();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });
});
