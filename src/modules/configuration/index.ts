import { createMonoLogger } from '@withmono/logger';

import { configValues, isTransformConfigValue } from './mapping';
import { getEnv } from './util';

export { ConfigService, getConfigService } from './config.service';

export function validateEnvVars(): void {
  const missingRequiredEnvVars: string[] = [];
  const missingOptionalEnvVars: string[] = [];
  const invalidRequiredEnvVars: string[] = [];
  const invalidOptionalEnvVars: string[] = [];

  for (const variable of configValues) {
    const isRequired = variable.required;
    const hasTransform = isTransformConfigValue(variable);

    try {
      const envValue = getEnv(variable.env);
      const value = hasTransform ? variable.transform!(envValue) : envValue;
      const isDefined = value != null;

      if (!isDefined) {
        const list = isRequired ? missingRequiredEnvVars : missingOptionalEnvVars;
        list.push(variable.env);
      }
    } catch {
      const list = isRequired ? invalidRequiredEnvVars : invalidOptionalEnvVars;
      list.push(variable.env);
    }
  }

  if (missingRequiredEnvVars.length || invalidRequiredEnvVars.length) {
    const variables = [...missingRequiredEnvVars, ...invalidRequiredEnvVars].join(', ');
    throw new Error(`Missing or invalid required environment variables: ${variables}`);
  }

  if (missingOptionalEnvVars.length || invalidOptionalEnvVars.length) {
    const variables = [...missingOptionalEnvVars, ...invalidOptionalEnvVars].join(', ');
    createMonoLogger({ context: 'envValidation' }).warn(
      `Warning: Missing or invalid environment variables: ${variables}`,
    );
  }
}
