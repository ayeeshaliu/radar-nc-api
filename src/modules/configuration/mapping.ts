/**
 * This is a mapping of all the environment variables that the project uses.
 * Getting a value from your config service should be done by calling
 * `configService.get(key)` where key is one of the keys in this object.
 */
export const configMapping = {
  // for service identification: required in all services
  serviceId: {
    env: 'SERVICE_ID',
    required: true,
  },

  timezone: {
    env: 'TZ',
    required: true,
  },

  // for redis connection: required in services that use redis.
  // Remove this if your service does not use redis
  redisUrl: {
    env: 'REDIS_URL',
    required: true,
  },

  airtableApiBaseUrl: {
    env: 'AIRTABLE_API_BASE_URL',
    required: true,
  },

  airtableApiKey: {
    env: 'AIRTABLE_API_KEY',
    required: true,
  },

  airtableBaseId: {
    env: 'AIRTABLE_BASE_ID',
    required: true,
  },

  airtableStartupsTableId: {
    env: 'AIRTABLE_STARTUPS_TABLE_ID',
    required: true,
  },

  airtableUsersTableId: {
    env: 'AIRTABLE_USERS_TABLE_ID',
    required: true,
  },

  jwtSecret: {
    env: 'JWT_SECRET',
    required: true,
  },

  jwtIssuer: {
    env: 'JWT_ISSUER',
    required: true,
  },

  jwtAudience: {
    env: 'JWT_AUDIENCE',
    required: true,
  },

  // for debug mode detection: optional
  isDebugMode: {
    env: 'DEBUG',
    required: false,
  },
} as const;

export type ConfigKey = keyof typeof configMapping;
export type ConfigValue<T = unknown> = {
  env: string;
  required: boolean;
  transform?: TransformFunction<T>;
};
export type TransformFunction<T> = (value: string | null | undefined) => T;
export const configValues = Object.values(configMapping) as ConfigValue[];

export function isTransformConfigValue<T>(
  value: ConfigValue<T>,
): value is Required<ConfigValue<T>> {
  return 'transform' in value && typeof value.transform === 'function';
}
