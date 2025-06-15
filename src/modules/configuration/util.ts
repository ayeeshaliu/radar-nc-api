const envCache: Record<string, string | undefined> = {};

/**
 * Gets the value of the environment variable. The key is provided as-is, but the
 * full key used is the ENV_PREFIX followed by an underscore and the key.
 * @param key
 */
export function getEnv(key: string): string | undefined {
  envCache[key] ??= process.env[key];
  return envCache[key];
}

/**
 * Transforms a string to a number. Throws an error if the value is not a number.
 *
 * @param envKey
 * @param value
 */
export function transformNumber(envKey: string, value: string | null | undefined): number {
  if (!value) {
    throw new Error(`${envKey} is not set`);
  }

  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`${envKey} is not a number`);
  }

  return parsed;
}

/**
 * Sets the given environment variable to the given value if it is not already set. The key
 * is provided as-is, but the full key used is the ENV_PREFIX followed by an underscore and the key.
 *
 * @param key
 * @param value
 */
export function setDefaultEnvVar(key: string, value: string): void {
  process.env[key] ??= value;
}
