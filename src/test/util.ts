import { randomUUID } from 'crypto';

import { jest } from '@jest/globals';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { FunctionLike, UnknownFunction } from 'jest-mock';
import type { ContainerInstance } from 'typedi';

import { runInScope } from '@withmono/di';
import type { MonoLogger } from '@withmono/logger';
import { lock } from '@withmono/synchronized';

import * as testgen from './generator';

export { testgen };

/**
 * This file should only contain utilities used for tests. All tests should
 * be written close to the service they are testing. This file should not
 * contain any tests.
 */

/**
 * Generate a mock logger object for use in tests
 */
export function getMockLogger(): jest.Mocked<MonoLogger> {
  const logger = {
    ...generateMockObject('info', 'warn', 'error', 'debug', 'addContext', 'child'),
    context: {},
  };
  logger.child = () => getMockLogger();

  return logger as jest.Mocked<MonoLogger>;
}

/**
 * A simple wrapper to cast a value to a jest.Mock
 * @param fn
 */
export function asMock<T extends FunctionLike = UnknownFunction>(fn: T): jest.Mock<T> {
  return fn as unknown as jest.Mock<T>;
}

export function mockConstructor<T extends object>(
  constructor: new (...args: unknown[]) => T,
  methods: Array<string & keyof T>,
): jest.Mocked<T> {
  const obj = generateMockObject<T>(...methods);
  asMock(constructor as unknown as FunctionLike).mockImplementation(() => obj);
  return obj;
}

/**
 * Generate a mock object with the given methods. Only generate
 * the methods needed for your test to run and assert on them
 * @param methods
 */
export function generateMockObject<T extends object>(
  ...methods: Array<keyof T & string>
): jest.Mocked<T> {
  const initial: Record<string, jest.Mock> = {};
  return methods.reduce((acc, method) => {
    acc[method] = jest.fn();
    return acc;
  }, initial) as jest.Mocked<T>;
}

export function mockRunInScope(): jest.Mocked<ContainerInstance> {
  const mockInstance: jest.Mocked<ContainerInstance> = generateMockObject('get', 'set', 'getMany');
  asMock(runInScope).mockImplementation((fn) => fn(mockInstance));
  return mockInstance;
}

/**
 * Mock the lock function to always execute without locking.
 */
export function mockLockNoOp(): void {
  asMock(lock).mockImplementation((_logger, _key, callback) => callback());
}

/**
 * Mock the `axios.create` function to return a mock axios instance
 */
export function mockAxiosCreate(): jest.Mocked<AxiosInstance> {
  const axiosMock = generateMockObject<AxiosInstance>('request');
  axiosMock.defaults = { headers: {} } as typeof axiosMock.defaults;
  asMock(axios.create).mockImplementation((config) => {
    if (config?.headers) {
      Object.assign(config.headers, axiosMock.defaults.headers);
    }

    Object.assign(axiosMock.defaults, config);
    return axiosMock;
  });
  return axiosMock;
}

/**
 * Check if a mock function has been called with a substring
 *
 * @param mock
 * @param substring
 */
export function hasBeenCalledWithSubstring(mock: jest.Mock, substring: string): boolean {
  return mock.mock.calls.some((args) => args.some((arg) => arg?.toString().includes(substring)));
}

/**
 * Generate a unique object with random values
 */
export function generateObject<T extends object>(overrides: Partial<T> = {}): T {
  return {
    value: randomUUID(),
    ...overrides,
  } as unknown as T;
}

/**
 * Generate an array of objects with random values
 * @param length
 */
export function generateArray<T extends object>(length = 5): T[] {
  return Array.from({ length }, () => generateObject<T>());
}

/**
 * A map of request URLs to their responses. If the response is an array, the responses
 * will be returned in order for each request. Subsequent requests will return the last
 * response in the array.
 */
export type AxiosRequestMap = Map<string, Partial<AxiosResponse>>;

/**
 * Mock the axios request function to return the response from the requestResponseMap
 *
 * @param client
 * @param requestResponseMap See AxiosRequestMap
 */
export function mockAxiosRequest(client: AxiosInstance, requestResponseMap: AxiosRequestMap): void {
  const returnValueMappings: ReturnValueMapping<typeof axios.request>[] = [];
  for (const [key, value] of requestResponseMap) {
    const defaults: Record<string, unknown> = {
      headers: {},
    };
    Object.assign(value, defaults);
    returnValueMappings.push({
      condition: (config: AxiosRequestConfig) => {
        value.config = config as typeof value.config;
        return `${config.method?.toUpperCase()} ${config.url}` === key;
      },
      returnValue: Promise.resolve(value),
    });
  }
  mockReturnValueForParams(client.request, returnValueMappings);
}

/**
 * Get the HTTP request log from the mock logger
 *
 * @param logger
 */
export function getHttpRequestLog(logger: MonoLogger): string {
  return JSON.stringify(
    asMock(logger.info).mock.calls.find((c) => c[0]?.toString().includes('HTTP request')),
  );
}

type ReturnValueMapping<TFunction extends FunctionLike> = {
  condition: (...args: Parameters<TFunction>) => boolean;
  returnValue: ReturnType<TFunction>;
};

/**
 * Mock the return value of a function based on the parameters passed to it
 *
 * @param f
 * @param returnValueMappings
 */
export function mockReturnValueForParams<TFunction extends FunctionLike>(
  f: TFunction,
  returnValueMappings: ReturnValueMapping<TFunction>[],
): void {
  const implementation = ((...args: Parameters<TFunction>) => {
    const index = returnValueMappings.findIndex((m) => m.condition(...args));
    if (index === -1) {
      throw new Error(
        `No return value mapping found for ${f.name} with args: ${JSON.stringify(args)}`,
      );
    }
    return returnValueMappings[index].returnValue;
  }) as TFunction;
  asMock(f).mockImplementation(implementation);
}
