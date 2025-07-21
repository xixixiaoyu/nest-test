// src/app.controller.ts
import { Controller, Get, Inject, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { SessionService } from './session/session.service';

@Controller()
export class AppController {
  @Inject(SessionService)
  private sessionService: SessionService;

  @Get('count')
  async count(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // 从请求cookie中获取会话ID
    const sid = req.cookies?.sid;

    // 获取会话数据中的计数值
    const sessionData = await this.sessionService.getSession<{ count: string }>(
      sid,
    );

    // 计算新的计数值：如果存在则加1，不存在则初始化为1
    const currentCount = sessionData?.count
      ? parseInt(sessionData.count) + 1
      : 1;

    // 更新会话数据，保存新的计数值
    const newSid = await this.sessionService.setSession(sid, {
      count: currentCount,
    });

    // 设置新的会话ID到cookie，有效期30分钟
    res.cookie('sid', newSid, { maxAge: 1800 * 1000 }); // 30 分钟过期

    // 返回当前计数值
    return { count: currentCount };
  }
}
