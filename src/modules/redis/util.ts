import Redis from 'ioredis';

import { getConfigService } from '../configuration';
import { lazy } from '../shared';

const getRedis = lazy(() => {
  const redis = new Redis(getConfigService().getRequired('redisUrl'), {
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
  });

  redis.on('ready', () => {
    process.stdout.write('redis connection is ready \n');
  });

  redis.on('error', (err) => {
    process.stderr.write(`an error occurred connecting to redis ${err.message} \n`);
  });
  return redis;
});

export default getRedis;
