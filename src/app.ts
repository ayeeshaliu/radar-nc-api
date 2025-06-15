import express from 'express';
import helmet from 'helmet';
import { useExpressServer } from 'routing-controllers';

import { diMiddleware, useScopedContainer } from '@withmono/di';
import { rootLoggerMiddleware } from '@withmono/logger';

import { AppErrorHandler, authMiddleware, healthcheckMiddleware } from './middleware';
import { AuthController, getConfigService, StartupsController } from './modules';
import { AdminStartupsController } from './modules/startups/controllers';

const app = express();
const configService = getConfigService();

// add middleware
app.use(helmet());
app.use(express.json());

// add this before the logger to avoid unnecessary healthcheck
// request logs
app.use(healthcheckMiddleware);

app.use(rootLoggerMiddleware(configService.isDebugMode()));

// inject the DI container and auth middleware
app.use(diMiddleware);
app.use(authMiddleware);

// use the scoped container for routing-controllers
useScopedContainer();

useExpressServer(app, {
  routePrefix: '/v1',
  defaultErrorHandler: false,
  controllers: [StartupsController, AdminStartupsController, AuthController],
  middlewares: [AppErrorHandler],
});

export default app;
