import 'reflect-metadata';
import './env';
import { Container } from 'typedi';

import { diConstants } from '@withmono/di';
import type { MonoLogger } from '@withmono/logger';

import app from './app';
import { startJobs, stopJobs } from './modules';

// logger used outside of job and request execution flows
const globalLogger = Container.get(diConstants.logger) as MonoLogger;

const PORT = Number(process.env.PORT) || 8080;

// start the server
const server = app.listen(PORT, () => {
  globalLogger.info({
    msg: `Server started ⚡ on port ${PORT}`,
    context: 'express-server',
  });
});

// setup crons and triggered job workers
startJobs();

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (reason, promise) => {
  globalLogger.error('Unhandled Rejection error', {
    context: 'unhandledRejection',
    reason,
    promise,
  });
});

process.on('uncaughtException', (err, origin) => {
  globalLogger.error('Uncaught Exception error', {
    context: 'uncaughtException',
    err,
    origin,
  });
});

process.on('exit', (code) => {
  globalLogger.info({
    msg: 'Process exited',
    context: 'exit',
    code,
  });
});

async function gracefulShutdown() {
  globalLogger.info('Gracefully shutting down');
  server.close();

  await stopJobs();
}
