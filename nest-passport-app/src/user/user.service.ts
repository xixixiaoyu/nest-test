// src/user/user.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  // 模拟数据库中的用户数据
  private readonly users = [
    { userId: 1, username: 'admin', password: 'password123' },
    { userId: 2, username: 'user', password: 'password456' },
  ];

  async findOne(username: string) {
    return this.users.find((user) => user.username === username);
  }
}
