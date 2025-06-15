import * as process from 'node:process';

import { validateEnvVars } from './modules';
import { setDefaultEnvVar } from './modules/configuration/util';

// Set all safe public environment variables here
// that are *very* unlikely to ever change and remain the
// same regardless of the environment the application is running in
process.env.TZ = 'UTC';

const serviceId = 'radar-nc-api';

process.env.SERVICE_ID = serviceId;

setDefaultEnvVar('JWT_ISSUER', serviceId);
setDefaultEnvVar('JWT_AUDIENCE', serviceId);

// This is run on startup to ensure that all required environment variables are
// set before the application starts
validateEnvVars();
