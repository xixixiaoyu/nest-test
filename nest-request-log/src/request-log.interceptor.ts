// src/request-log.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import * as requestIp from 'request-ip';
import * as iconv from 'iconv-lite';

@Injectable()
export class RequestLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLogInterceptor.name);

  constructor(private readonly httpService: HttpService) {}

  // 查询 IP 地理位置
  private async getCityFromIp(ip: string): Promise<string> {
    if (ip.includes('127.0.0.1') || ip.includes('::1')) {
      return '本地';
    }
    try {
      const url = `https://whois.pconline.com.cn/ipJson.jsp?ip=${ip}&json=true`;
      const response = await this.httpService.axiosRef.get(url, {
        responseType: 'arraybuffer',
      });
      const dataStr = iconv.decode(response.data, 'gbk');
      const data = JSON.parse(dataStr);
      return data.addr?.trim() || '未知';
    } catch (error) {
      this.logger.error(`IP 查询失败: ${ip}`, error.message);
      return '未知';
    }
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const { method, path } = request;
    const clientIp = requestIp.getClientIp(request);
    const userAgent = request.headers['user-agent'] || '未知';
    const city = await this.getCityFromIp(clientIp);

    this.logger.debug(
      `[请求] ${method} ${path} - IP: ${clientIp} (${city}) - User-Agent: ${userAgent} - ` +
        `${context.getClass().name}.${context.getHandler().name}`,
    );

    const startTime = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        this.logger.debug(
          `[响应] ${method} ${path} - IP: ${clientIp} (${city}) - 状态: ${response.statusCode} - 耗时: ${duration}ms`,
        );
        this.logger.debug(`响应内容: ${JSON.stringify(data)}`);
      }),
    );
  }
}
