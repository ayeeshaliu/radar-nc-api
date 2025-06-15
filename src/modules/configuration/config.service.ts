import { Container, Inject, Service } from 'typedi';

import { diConstants } from '@withmono/di';
import { MonoLogger } from '@withmono/logger';

import ConfigNotFoundError from './error';
import { ConfigKey, configMapping, ConfigValue, isTransformConfigValue } from './mapping';
import { getEnv } from './util';

/**
 * This service is used to access configuration values your application needs.
 * You can add new configuration keys by adding them to the `configMapping` object
 * in the `mapping.ts` file.
 *
 * You can also extend this service to add new functions for accessing configuration
 * values in a specific format when needed by your application. For example, if you
 * need to parse a config value as a number, you can add a `getNumber` function to
 * this service.
 */
@Service({ global: true })
export class ConfigService {
  constructor(@Inject(diConstants.logger) private readonly logger: MonoLogger) {}

  /**
   * Get the value of a potentially optional configuration key
   * @param key
   * @param defaultValue
   */
  get(key: ConfigKey, defaultValue?: string): string | null {
    return getEnv(configMapping[key].env) || defaultValue || null;
  }

  /**
   * Get the value of a required configuration key.
   * If the key is not set, an error is thrown.
   * @param key
   */
  getRequired(key: ConfigKey): string {
    const value = this.get(key);
    if (value != null) {
      return value;
    }

    const e = new ConfigNotFoundError(`Missing required environment variable: ${key}`, key);
    this.logger.error(e);
    throw e;
  }

  /**
   * Get the value of a config variable after its transform has been applied.
   * This function will throw an error if the key does not have a transform.
   * @param key
   */
  getTransformed<T>(key: ConfigKey): T {
    const mapping = configMapping[key] as ConfigValue;
    if (!isTransformConfigValue(mapping)) {
      throw new Error(`No transformation function found for key: ${key}`);
    }

    const value = this.get(key);
    return mapping.transform(value) as T;
  }

  /**
   * Get a key scoped to the current service and a provided namespace
   * @param key
   * @param namespace
   * @param delimiter
   */
  getNamespacedKey(key: string, namespace = 'default', delimiter = ':'): string {
    const serviceName = this.getRequired('serviceId');
    return `${serviceName}${delimiter}${namespace}${delimiter}${key}`;
  }

  /**
   * Check if the application is running in debug mode
   */
  isDebugMode(): boolean {
    return this.get('isDebugMode')?.toLowerCase() === 'true';
  }

  getGlobalServiceKey(): string {
    return 'disburse-global';
  }
}

/**
 * Since ConfigService is a singleton service, this works for cases where we need the service
 * without having to inject it into a class.
 */
export function getConfigService(): ConfigService {
  return Container.get(ConfigService);
}
