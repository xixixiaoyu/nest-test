# 09 - 控制器设计

本章将详细介绍如何设计和实现 NestJS 控制器，将前面章节实现的监控功能通过 RESTful API 对外提供服务，包括接口设计、参数验证、错误处理等。

## 🎯 学习目标

- 理解 RESTful API 设计原则
- 学会设计清晰的接口结构
- 掌握 NestJS 控制器的高级用法
- 实现参数验证和错误处理
- 了解 API 文档和版本管理

## 🏗️ API 设计原则

### RESTful API 设计规范

| HTTP 方法 | 用途 | 示例 |
|----------|------|------|
| GET | 获取资源 | `GET /status` - 获取服务器状态 |
| POST | 创建资源 | `POST /monitoring/start` - 启动监控 |
| PUT | 更新资源 | `PUT /monitoring/config` - 更新配置 |
| DELETE | 删除资源 | `DELETE /monitoring/history` - 清空历史 |

### 接口设计原则

1. **一致性**: 统一的命名规范和响应格式
2. **可预测性**: 接口行为符合直觉
3. **版本化**: 支持 API 版本管理
4. **文档化**: 完整的接口文档
5. **错误处理**: 统一的错误响应格式

## 📊 接口结构设计

### 1. 基础监控接口

```typescript
// 接口路径设计
/api/v1/status              // 获取完整服务器状态
/api/v1/status/cpu          // 获取 CPU 信息
/api/v1/status/memory       // 获取内存信息
/api/v1/status/disk         // 获取磁盘信息
/api/v1/status/system       // 获取系统信息
/api/v1/status/cpu-dynamic  // 获取动态 CPU 使用率
```

### 2. 动态监控接口

```typescript
// 监控管理接口
/api/v1/monitoring/start    // 启动监控
/api/v1/monitoring/stop     // 停止监控
/api/v1/monitoring/status   // 获取监控状态
/api/v1/monitoring/config   // 获取/更新监控配置

// 历史数据接口
/api/v1/monitoring/history  // 获取历史数据
/api/v1/monitoring/trend    // 获取趋势分析
/api/v1/monitoring/alerts   // 获取告警信息
```

## 🔧 实现监控控制器

### 1. 基础状态控制器

更新 `src/app.controller.ts`：

```typescript
import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import {
  getCpuInfo,
  getMemInfo,
  getDiskInfo,
  getSysInfo,
  getDynamicCpuUsage,
} from './utils/system-info';

/**
 * 查询参数 DTO
 */
interface StatusQueryDto {
  format?: 'json' | 'simple';
  unit?: 'GB' | 'MB' | 'KB';
}

@Controller('api/v1')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * 获取完整服务器状态
   * @param query 查询参数
   * @returns 包含 CPU、内存、磁盘和系统信息的对象
   */
  @Get('status')
  async getStatus(@Query() query: StatusQueryDto) {
    try {
      // 并行获取所有信息，提高效率
      const [cpu, mem, disk, sys] = await Promise.all([
        Promise.resolve(getCpuInfo()),
        Promise.resolve(getMemInfo()),
        getDiskInfo(),
        Promise.resolve(getSysInfo()),
      ]);

      const result = {
        timestamp: new Date().toISOString(),
        cpu,
        mem,
        disk,
        sys,
      };

      // 根据格式参数返回不同格式
      if (query.format === 'simple') {
        return {
          timestamp: result.timestamp,
          cpu_usage: cpu.used,
          memory_usage: mem.usage,
          disk_usage: disk.length > 0 ? disk[0].usage : '0%',
          system: sys.computerName,
        };
      }

      return result;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: '获取服务器状态失败',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取 CPU 信息
   * @returns CPU 使用情况
   */
  @Get('status/cpu')
  getCpuStatus() {
    try {
      return {
        timestamp: new Date().toISOString(),
        data: getCpuInfo(),
      };
    } catch (error) {
      throw new HttpException(
        '获取 CPU 信息失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取动态 CPU 使用率（需要等待 1 秒采样）
   * @returns CPU 动态使用情况
   */
  @Get('status/cpu-dynamic')
  async getDynamicCpuStatus() {
    try {
      const data = await getDynamicCpuUsage();
      return {
        timestamp: new Date().toISOString(),
        data,
        note: '此数据通过 1 秒采样获得，更准确反映当前 CPU 使用率',
      };
    } catch (error) {
      throw new HttpException(
        '获取动态 CPU 信息失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取内存信息
   * @returns 内存使用情况
   */
  @Get('status/memory')
  getMemoryStatus() {
    try {
      return {
        timestamp: new Date().toISOString(),
        data: getMemInfo(),
      };
    } catch (error) {
      throw new HttpException(
        '获取内存信息失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取磁盘信息
   * @returns 磁盘使用情况
   */
  @Get('status/disk')
  async getDiskStatus() {
    try {
      const data = await getDiskInfo();
      return {
        timestamp: new Date().toISOString(),
        data,
        count: data.length,
      };
    } catch (error) {
      throw new HttpException(
        '获取磁盘信息失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取系统信息
   * @returns 系统基本信息
   */
  @Get('status/system')
  getSystemInfo() {
    try {
      return {
        timestamp: new Date().toISOString(),
        data: getSysInfo(),
      };
    } catch (error) {
      throw new HttpException(
        '获取系统信息失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
```

### 2. 动态监控控制器

创建 `src/monitoring.controller.ts`：

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DynamicMonitor, TrendAnalyzer, AlertManager } from './utils/dynamic-monitoring';

/**
 * 监控配置 DTO
 */
interface MonitoringConfigDto {
  interval?: number;
  historySize?: number;
  enableAlerts?: boolean;
  thresholds?: {
    cpu?: number;
    memory?: number;
    disk?: number;
  };
}

/**
 * 历史查询 DTO
 */
interface HistoryQueryDto {
  count?: number;
  minutes?: number;
  format?: 'full' | 'summary';
}

@Controller('api/v1/monitoring')
export class MonitoringController {
  private monitor: DynamicMonitor;
  private alertManager: AlertManager;

  constructor() {
    this.monitor = new DynamicMonitor();
    this.alertManager = new AlertManager();
    
    // 设置事件监听
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners() {
    this.monitor.on('data', (dataPoint) => {
      this.alertManager.checkAlerts(dataPoint);
    });

    this.monitor.on('error', (error) => {
      console.error('监控错误:', error);
    });

    this.alertManager.on('alert', (alert) => {
      console.log('新告警:', alert.message);
    });
  }

  /**
   * 启动监控
   * @param config 监控配置
   */
  @Post('start')
  startMonitoring(@Body() config?: MonitoringConfigDto) {
    try {
      if (config) {
        this.monitor.updateConfig(config);
      }
      
      this.monitor.start();
      
      return {
        success: true,
        message: '监控已启动',
        config: this.monitor.getStatus(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        '启动监控失败: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 停止监控
   */
  @Post('stop')
  stopMonitoring() {
    try {
      this.monitor.stop();
      
      return {
        success: true,
        message: '监控已停止',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        '停止监控失败: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取监控状态
   */
  @Get('status')
  getMonitoringStatus() {
    try {
      const status = this.monitor.getStatus();
      const latest = this.monitor.getLatest();
      const activeAlerts = this.alertManager.getActiveAlerts();

      return {
        status,
        latest,
        alerts: {
          active: activeAlerts.length,
          total: this.alertManager.getAllAlerts().length,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        '获取监控状态失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取监控配置
   */
  @Get('config')
  getMonitoringConfig() {
    // 注意：这里需要在 DynamicMonitor 类中添加 getConfig 方法
    return {
      config: this.monitor['config'], // 临时访问私有属性
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 更新监控配置
   * @param config 新的监控配置
   */
  @Put('config')
  updateMonitoringConfig(@Body() config: MonitoringConfigDto) {
    try {
      this.monitor.updateConfig(config);
      
      return {
        success: true,
        message: '配置已更新',
        config: this.monitor['config'],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        '更新配置失败: ' + error.message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 获取历史数据
   * @param query 查询参数
   */
  @Get('history')
  getHistory(@Query() query: HistoryQueryDto) {
    try {
      let history;
      
      if (query.count) {
        history = this.monitor.getHistory(query.count);
      } else {
        history = this.monitor.getHistory();
      }

      // 根据时间范围过滤
      if (query.minutes) {
        const cutoff = Date.now() - (query.minutes * 60 * 1000);
        history = history.filter(point => point.timestamp > cutoff);
      }

      // 根据格式参数返回不同详细程度的数据
      if (query.format === 'summary') {
        history = history.map(point => ({
          timestamp: point.timestamp,
          cpu: point.cpu.usage,
          memory: point.memory.usage,
          disk: Math.max(...point.disk.map(d => d.usage)),
        }));
      }

      return {
        data: history,
        count: history.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        '获取历史数据失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取趋势分析
   * @param query 查询参数
   */
  @Get('trend')
  getTrend(@Query() query: { minutes?: number }) {
    try {
      const minutes = query.minutes || 10;
      const history = this.monitor.getHistory();
      const trend = TrendAnalyzer.analyzeMonitoringTrend(history, minutes);

      return {
        trend,
        period: `${minutes} 分钟`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        '获取趋势分析失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取告警信息
   * @param query 查询参数
   */
  @Get('alerts')
  getAlerts(@Query() query: { active?: boolean }) {
    try {
      const alerts = query.active === true 
        ? this.alertManager.getActiveAlerts()
        : this.alertManager.getAllAlerts();

      return {
        alerts,
        count: alerts.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        '获取告警信息失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 清空历史数据
   */
  @Delete('history')
  clearHistory() {
    try {
      this.monitor.clearHistory();
      
      return {
        success: true,
        message: '历史数据已清空',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        '清空历史数据失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 清空告警
   */
  @Delete('alerts')
  clearAlerts() {
    try {
      this.alertManager.clearAlerts();
      
      return {
        success: true,
        message: '告警已清空',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        '清空告警失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
```

### 3. 更新应用模块

更新 `src/app.module.ts`：

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MonitoringController } from './monitoring.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController, MonitoringController],
  providers: [AppService],
})
export class AppModule {}
```

## 🎨 高级功能实现

### 1. 参数验证

安装验证相关依赖：

```bash
npm install class-validator class-transformer
```

创建 DTO 类：

```typescript
// src/dto/monitoring.dto.ts
import { IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class MonitoringConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(300000)
  interval?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(10000)
  historySize?: number;

  @IsOptional()
  @IsBoolean()
  enableAlerts?: boolean;

  @IsOptional()
  thresholds?: {
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    cpu?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    memory?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    disk?: number;
  };
}

export class HistoryQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(1000)
  count?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(1440)
  minutes?: number;

  @IsOptional()
  format?: 'full' | 'summary';
}
```

### 2. 全局异常过滤器

创建 `src/filters/http-exception.filter.ts`：

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message || '内部服务器错误',
    };

    // 记录错误日志
    console.error(`HTTP ${status} Error:`, {
      ...errorResponse,
      stack: exception.stack,
    });

    response.status(status).json(errorResponse);
  }
}
```

### 3. 响应拦截器

创建 `src/interceptors/response.interceptor.ts`：

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  timestamp: string;
  duration: number;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const startTime = Date.now();
    
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      })),
    );
  }
}
```

### 4. 更新主应用文件

更新 `src/main.ts`：

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用 CORS
  app.enableCors();

  // 设置全局前缀
  app.setGlobalPrefix('api/v1');

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(3000);
  console.log('服务器监控 API 启动成功，端口: 3000');
  console.log('API 文档: http://localhost:3000/api/v1/status');
}
bootstrap();
```

## 🧪 测试控制器功能

### 创建测试文件

创建 `src/test/controller.test.ts`：

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../app.controller';
import { MonitoringController } from '../monitoring.controller';
import { AppService } from '../app.service';

describe('Controllers', () => {
  let appController: AppController;
  let monitoringController: MonitoringController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController, MonitoringController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    monitoringController = app.get<MonitoringController>(MonitoringController);
  });

  describe('AppController', () => {
    it('should return server status', async () => {
      const result = await appController.getStatus({});
      expect(result).toHaveProperty('cpu');
      expect(result).toHaveProperty('mem');
      expect(result).toHaveProperty('disk');
      expect(result).toHaveProperty('sys');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return CPU status', () => {
      const result = appController.getCpuStatus();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('timestamp');
      expect(result.data).toHaveProperty('cpuNum');
      expect(result.data).toHaveProperty('used');
    });

    it('should return memory status', () => {
      const result = appController.getMemoryStatus();
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('total');
      expect(result.data).toHaveProperty('used');
      expect(result.data).toHaveProperty('usage');
    });
  });

  describe('MonitoringController', () => {
    it('should start monitoring', () => {
      const result = monitoringController.startMonitoring();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('should get monitoring status', () => {
      const result = monitoringController.getMonitoringStatus();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
    });

    it('should stop monitoring', () => {
      const result = monitoringController.stopMonitoring();
      expect(result).toHaveProperty('success', true);
    });
  });
});
```

### 运行测试

```bash
npm run test
```

## 📈 性能优化

### 1. 缓存机制

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  private cache = new Map<string, { data: any; expiry: number }>();

  set(key: string, data: any, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}
```

### 2. 请求限流

```bash
npm install @nestjs/throttler
```

```typescript
// 在 app.module.ts 中配置
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
  ],
  // ...
})
export class AppModule {}
```

## 🎉 小结

在这一章中，我们学习了：

1. **API 设计原则**：RESTful 设计规范和最佳实践
2. **控制器实现**：基础状态和动态监控控制器
3. **参数验证**：使用 DTO 和验证管道
4. **错误处理**：全局异常过滤器和统一错误格式
5. **响应格式化**：统一的响应结构和拦截器
6. **性能优化**：缓存机制和请求限流

## 🔗 下一步

现在您已经掌握了控制器设计，接下来我们将学习 [API 测试](./10-api-testing.md)，了解如何全面测试我们的监控 API。

## 💡 常见问题

### Q: 如何处理大量并发请求？

A: 可以采用以下策略：
- **请求限流**: 使用 throttler 限制请求频率
- **缓存机制**: 缓存频繁访问的数据
- **异步处理**: 使用队列处理耗时操作
- **负载均衡**: 多实例部署分散负载

### Q: API 版本如何管理？

A: 推荐的版本管理策略：
- **URL 版本**: `/api/v1/status`, `/api/v2/status`
- **Header 版本**: `Accept: application/vnd.api+json;version=1`
- **向后兼容**: 保持旧版本一段时间
- **版本文档**: 维护各版本的文档

### Q: 如何保证 API 的安全性？

A: 安全措施包括：
- **身份认证**: JWT、OAuth 等认证机制
- **权限控制**: 基于角色的访问控制
- **输入验证**: 严格的参数验证
- **HTTPS**: 加密传输
- **API 密钥**: 限制访问来源

### Q: 如何监控 API 的性能？

A: 可以监控以下指标：
- **响应时间**: 平均响应时间和 P99
- **请求量**: QPS 和并发数
- **错误率**: 4xx 和 5xx 错误比例
- **资源使用**: CPU、内存使用情况
