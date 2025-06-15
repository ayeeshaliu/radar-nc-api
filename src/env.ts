import * as process from 'node:process';

import { validateEnvVars } from './modules/configuration';

// Set all safe public environment variables here
// that are *very* unlikely to ever change and remain the
// same regardless of the environment the application is running in
process.env.TZ = 'UTC';
process.env.SERVICE_ID = 'radar-nc-api';

// This is run on startup to ensure that all required environment variables are
// set before the application starts
validateEnvVars();
