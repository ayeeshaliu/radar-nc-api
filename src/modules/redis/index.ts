import { Inject, Service } from 'typedi';

import { ConfigService } from '../configuration';

import getRedis from './util';

export { getRedis };

@Service()
export class RedisCache {
  constructor(@Inject() private readonly configService: ConfigService) {}

  async set(
    key: string,
    value: string,
    validityMinutes: number,
    namespace = 'default',
  ): Promise<void> {
    await getRedis().set(
      this.configService.getNamespacedKey(key, namespace),
      value,
      'EX',
      validityMinutes * 60,
    );
  }

  get(key: string, namespace = 'default'): Promise<string | null> {
    return getRedis().get(this.configService.getNamespacedKey(key, namespace));
  }

  async delete(key: string, namespace = 'default'): Promise<void> {
    await getRedis().del(this.configService.getNamespacedKey(key, namespace));
  }
}
