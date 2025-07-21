// src/redis/redis.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  // 注入 Redis 客户端实例
  @Inject('REDIS_CLIENT')
  private redisClient: RedisClientType;

  // 获取指定 key 的所有哈希字段和值
  async hashGet(key: string) {
    return await this.redisClient.hGetAll(key);
  }

  // 设置指定 key 的哈希字段和值，并可选设置过期时间
  async hashSet(key: string, obj: Record<string, any>, ttl?: number) {
    // 遍历对象，将每个字段和值存入 Redis 哈希
    for (const name in obj) {
      await this.redisClient.hSet(key, name, obj[name]);
    }
    // 如果提供了 ttl 参数，设置 key 的过期时间（单位：秒）
    if (ttl) {
      await this.redisClient.expire(key, ttl);
    }
  }
}
