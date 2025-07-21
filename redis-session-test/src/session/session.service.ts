// src/session/session.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

// 标记为可注入的服务类，用于管理用户会话
@Injectable()
export class SessionService {
  // 注入 Redis 服务，用于存储和操作会话数据
  @Inject(RedisService)
  private redisService: RedisService;

  // 获取指定会话 ID 的会话数据
  async getSession<SessionType extends Record<string, any>>(
    sid: string, // 会话 ID
  ): Promise<SessionType | null> {
    // 从 Redis 中获取会话数据
    const sessionData = await this.redisService.hashGet(`sid_${sid}`);
    // 如果数据为空，返回 null
    if (Object.keys(sessionData).length === 0) {
      return null;
    }
    // 返回类型转换后的会话数据
    return sessionData as SessionType;
  }

  // 设置或更新会话数据
  async setSession(
    sid: string, // 会话 ID
    value: Record<string, any>, // 会话数据
    ttl: number = 30 * 60, // 过期时间（秒），默认 30 分钟
  ) {
    // 如果未提供会话 ID，生成一个新的
    if (!sid) {
      sid = this.generateSid();
    }
    // 将会话数据存储到 Redis 中，并设置过期时间
    await this.redisService.hashSet(`sid_${sid}`, value, ttl);
    // 返回会话 ID
    return sid;
  }

  // 生成唯一的会话 ID
  private generateSid() {
    // 使用随机数生成简单唯一 ID，去掉前缀 "0."
    return Math.random().toString(36).slice(2);
  }
}
