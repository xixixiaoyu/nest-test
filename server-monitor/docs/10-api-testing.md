# 10 - API 测试

本章将详细介绍如何全面测试服务器监控 API，包括单元测试、集成测试、端到端测试，以及性能测试和自动化测试策略。

## 🎯 学习目标

- 理解不同类型的测试及其用途
- 学会编写单元测试和集成测试
- 掌握 API 端到端测试技巧
- 实现自动化测试流程
- 了解性能测试和负载测试

## 🧪 测试类型概览

### 测试金字塔

```
    /\
   /  \     E2E Tests (少量)
  /____\    
 /      \   Integration Tests (适量)
/__________\ Unit Tests (大量)
```

| 测试类型 | 特点 | 用途 | 执行速度 |
|---------|------|------|---------|
| 单元测试 | 测试单个函数/方法 | 验证业务逻辑 | 快 |
| 集成测试 | 测试模块间交互 | 验证组件协作 | 中等 |
| E2E 测试 | 测试完整流程 | 验证用户场景 | 慢 |

## 🔧 单元测试实现

### 1. 测试工具函数

创建 `src/utils/system-info.spec.ts`：

```typescript
import { getCpuInfo, getMemInfo, getSysInfo } from './system-info';
import * as os from 'os';

// Mock os 模块
jest.mock('os');
const mockedOs = os as jest.Mocked<typeof os>;

describe('System Info Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCpuInfo', () => {
    it('should return CPU information', () => {
      // 模拟 os.cpus() 返回值
      mockedOs.cpus.mockReturnValue([
        {
          model: 'Intel(R) Core(TM) i7-8750H CPU @ 2.20GHz',
          speed: 2208,
          times: {
            user: 252020,
            nice: 0,
            sys: 30340,
            idle: 1070356870,
            irq: 0,
          },
        },
        {
          model: 'Intel(R) Core(TM) i7-8750H CPU @ 2.20GHz',
          speed: 2208,
          times: {
            user: 251000,
            nice: 0,
            sys: 29000,
            idle: 1070000000,
            irq: 0,
          },
        },
      ]);

      const result = getCpuInfo();

      expect(result).toHaveProperty('cpuNum', 2);
      expect(result).toHaveProperty('sys');
      expect(result).toHaveProperty('used');
      expect(result).toHaveProperty('free');
      
      // 验证百分比格式
      expect(result.sys).toMatch(/^\d+\.\d{2}%$/);
      expect(result.used).toMatch(/^\d+\.\d{2}%$/);
      expect(result.free).toMatch(/^\d+\.\d{2}%$/);
    });

    it('should handle empty CPU array', () => {
      mockedOs.cpus.mockReturnValue([]);

      expect(() => getCpuInfo()).not.toThrow();
    });
  });

  describe('getMemInfo', () => {
    it('should return memory information', () => {
      mockedOs.totalmem.mockReturnValue(17179869184); // 16GB
      mockedOs.freemem.mockReturnValue(8589934592);   // 8GB

      const result = getMemInfo();

      expect(result).toHaveProperty('total', '16.00 GB');
      expect(result).toHaveProperty('used', '8.00 GB');
      expect(result).toHaveProperty('free', '8.00 GB');
      expect(result).toHaveProperty('usage', '50.00%');
    });

    it('should handle zero memory values', () => {
      mockedOs.totalmem.mockReturnValue(0);
      mockedOs.freemem.mockReturnValue(0);

      const result = getMemInfo();

      expect(result.total).toBe('0.00 GB');
      expect(result.usage).toBe('NaN%');
    });
  });

  describe('getSysInfo', () => {
    it('should return system information', () => {
      mockedOs.hostname.mockReturnValue('test-server');
      mockedOs.platform.mockReturnValue('linux');
      mockedOs.arch.mockReturnValue('x64');
      mockedOs.networkInterfaces.mockReturnValue({
        eth0: [
          {
            address: '192.168.1.100',
            netmask: '255.255.255.0',
            family: 'IPv4',
            mac: '00:11:22:33:44:55',
            internal: false,
            cidr: '192.168.1.100/24',
          },
        ],
      });

      const result = getSysInfo();

      expect(result).toEqual({
        computerName: 'test-server',
        computerIp: '192.168.1.100',
        osName: 'linux',
        osArch: 'x64',
      });
    });

    it('should return localhost when no external IP found', () => {
      mockedOs.hostname.mockReturnValue('test-server');
      mockedOs.platform.mockReturnValue('linux');
      mockedOs.arch.mockReturnValue('x64');
      mockedOs.networkInterfaces.mockReturnValue({
        lo: [
          {
            address: '127.0.0.1',
            netmask: '255.0.0.0',
            family: 'IPv4',
            mac: '00:00:00:00:00:00',
            internal: true,
            cidr: '127.0.0.1/8',
          },
        ],
      });

      const result = getSysInfo();

      expect(result.computerIp).toBe('127.0.0.1');
    });
  });
});
```

### 2. 测试控制器

创建 `src/app.controller.spec.ts`：

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as systemInfo from './utils/system-info';

// Mock 系统信息模块
jest.mock('./utils/system-info');
const mockedSystemInfo = systemInfo as jest.Mocked<typeof systemInfo>;

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStatus', () => {
    it('should return complete server status', async () => {
      // 模拟系统信息函数返回值
      mockedSystemInfo.getCpuInfo.mockReturnValue({
        cpuNum: 4,
        sys: '10.50%',
        used: '45.20%',
        free: '44.30%',
      });

      mockedSystemInfo.getMemInfo.mockReturnValue({
        total: '16.00 GB',
        used: '8.50 GB',
        free: '7.50 GB',
        usage: '53.13%',
      });

      mockedSystemInfo.getDiskInfo.mockResolvedValue([
        {
          mounted: '/',
          filesystem: 'ext4',
          total: '100.00 GB',
          used: '60.00 GB',
          free: '40.00 GB',
          usage: '60%',
        },
      ]);

      mockedSystemInfo.getSysInfo.mockReturnValue({
        computerName: 'test-server',
        computerIp: '192.168.1.100',
        osName: 'linux',
        osArch: 'x64',
      });

      const result = await appController.getStatus({});

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('cpu');
      expect(result).toHaveProperty('mem');
      expect(result).toHaveProperty('disk');
      expect(result).toHaveProperty('sys');

      expect(result.cpu.cpuNum).toBe(4);
      expect(result.mem.usage).toBe('53.13%');
      expect(result.disk).toHaveLength(1);
      expect(result.sys.computerName).toBe('test-server');
    });

    it('should return simple format when requested', async () => {
      mockedSystemInfo.getCpuInfo.mockReturnValue({
        cpuNum: 4,
        sys: '10.50%',
        used: '45.20%',
        free: '44.30%',
      });

      mockedSystemInfo.getMemInfo.mockReturnValue({
        total: '16.00 GB',
        used: '8.50 GB',
        free: '7.50 GB',
        usage: '53.13%',
      });

      mockedSystemInfo.getDiskInfo.mockResolvedValue([
        {
          mounted: '/',
          filesystem: 'ext4',
          total: '100.00 GB',
          used: '60.00 GB',
          free: '40.00 GB',
          usage: '60%',
        },
      ]);

      mockedSystemInfo.getSysInfo.mockReturnValue({
        computerName: 'test-server',
        computerIp: '192.168.1.100',
        osName: 'linux',
        osArch: 'x64',
      });

      const result = await appController.getStatus({ format: 'simple' });

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('cpu_usage', '45.20%');
      expect(result).toHaveProperty('memory_usage', '53.13%');
      expect(result).toHaveProperty('disk_usage', '60%');
      expect(result).toHaveProperty('system', 'test-server');
    });

    it('should handle errors gracefully', async () => {
      mockedSystemInfo.getCpuInfo.mockImplementation(() => {
        throw new Error('CPU 信息获取失败');
      });

      await expect(appController.getStatus({})).rejects.toThrow();
    });
  });

  describe('getCpuStatus', () => {
    it('should return CPU status with timestamp', () => {
      mockedSystemInfo.getCpuInfo.mockReturnValue({
        cpuNum: 8,
        sys: '15.25%',
        used: '60.75%',
        free: '24.00%',
      });

      const result = appController.getCpuStatus();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('data');
      expect(result.data.cpuNum).toBe(8);
      expect(result.data.used).toBe('60.75%');
    });
  });

  describe('getMemoryStatus', () => {
    it('should return memory status', () => {
      mockedSystemInfo.getMemInfo.mockReturnValue({
        total: '32.00 GB',
        used: '24.50 GB',
        free: '7.50 GB',
        usage: '76.56%',
      });

      const result = appController.getMemoryStatus();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('data');
      expect(result.data.total).toBe('32.00 GB');
      expect(result.data.usage).toBe('76.56%');
    });
  });

  describe('getDiskStatus', () => {
    it('should return disk status with count', async () => {
      mockedSystemInfo.getDiskInfo.mockResolvedValue([
        {
          mounted: '/',
          filesystem: 'ext4',
          total: '500.00 GB',
          used: '300.00 GB',
          free: '200.00 GB',
          usage: '60%',
        },
        {
          mounted: '/home',
          filesystem: 'ext4',
          total: '1000.00 GB',
          used: '400.00 GB',
          free: '600.00 GB',
          usage: '40%',
        },
      ]);

      const result = await appController.getDiskStatus();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('count', 2);
      expect(result.data).toHaveLength(2);
    });
  });
});
```

## 🔗 集成测试

### 1. 测试模块集成

创建 `src/test/integration/app.integration.spec.ts`：

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('App Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // 应用与生产环境相同的配置
    app.setGlobalPrefix('api/v1');
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/status (GET)', () => {
    it('should return server status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/status')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('cpu');
          expect(res.body).toHaveProperty('mem');
          expect(res.body).toHaveProperty('disk');
          expect(res.body).toHaveProperty('sys');
          expect(res.body).toHaveProperty('timestamp');
        });
    });

    it('should return simple format when requested', () => {
      return request(app.getHttpServer())
        .get('/api/v1/status?format=simple')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('cpu_usage');
          expect(res.body).toHaveProperty('memory_usage');
          expect(res.body).toHaveProperty('disk_usage');
          expect(res.body).toHaveProperty('system');
        });
    });

    it('should handle invalid format parameter', () => {
      return request(app.getHttpServer())
        .get('/api/v1/status?format=invalid')
        .expect(200); // 应该忽略无效参数，返回默认格式
    });
  });

  describe('/api/v1/status/cpu (GET)', () => {
    it('should return CPU information', () => {
      return request(app.getHttpServer())
        .get('/api/v1/status/cpu')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('cpuNum');
          expect(res.body.data).toHaveProperty('used');
          expect(res.body.data).toHaveProperty('sys');
          expect(res.body.data).toHaveProperty('free');
        });
    });
  });

  describe('/api/v1/status/memory (GET)', () => {
    it('should return memory information', () => {
      return request(app.getHttpServer())
        .get('/api/v1/status/memory')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('total');
          expect(res.body.data).toHaveProperty('used');
          expect(res.body.data).toHaveProperty('free');
          expect(res.body.data).toHaveProperty('usage');
        });
    });
  });

  describe('/api/v1/status/disk (GET)', () => {
    it('should return disk information', () => {
      return request(app.getHttpServer())
        .get('/api/v1/status/disk')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('count');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('/api/v1/status/system (GET)', () => {
    it('should return system information', () => {
      return request(app.getHttpServer())
        .get('/api/v1/status/system')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('computerName');
          expect(res.body.data).toHaveProperty('computerIp');
          expect(res.body.data).toHaveProperty('osName');
          expect(res.body.data).toHaveProperty('osArch');
        });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', () => {
      return request(app.getHttpServer())
        .get('/api/v1/non-existent')
        .expect(404);
    });

    it('should handle malformed requests gracefully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/status')
        .expect(404); // POST 不被支持
    });
  });
});
```

### 2. 监控功能集成测试

创建 `src/test/integration/monitoring.integration.spec.ts`：

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('Monitoring Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Monitoring Lifecycle', () => {
    it('should start monitoring', () => {
      return request(app.getHttpServer())
        .post('/api/v1/monitoring/start')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should get monitoring status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/monitoring/status')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('alerts');
        });
    });

    it('should update monitoring config', () => {
      const config = {
        interval: 10000,
        historySize: 200,
        enableAlerts: true,
        thresholds: {
          cpu: 85,
          memory: 90,
          disk: 95,
        },
      };

      return request(app.getHttpServer())
        .put('/api/v1/monitoring/config')
        .send(config)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
        });
    });

    it('should reject invalid config', () => {
      const invalidConfig = {
        interval: -1000, // 无效值
        historySize: 'invalid', // 错误类型
      };

      return request(app.getHttpServer())
        .put('/api/v1/monitoring/config')
        .send(invalidConfig)
        .expect(400);
    });

    it('should get history data', async () => {
      // 等待一些数据被收集
      await new Promise(resolve => setTimeout(resolve, 2000));

      return request(app.getHttpServer())
        .get('/api/v1/monitoring/history?count=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('count');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should get trend analysis', () => {
      return request(app.getHttpServer())
        .get('/api/v1/monitoring/trend?minutes=1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('trend');
          expect(res.body.trend).toHaveProperty('cpu');
          expect(res.body.trend).toHaveProperty('memory');
          expect(res.body.trend).toHaveProperty('disk');
        });
    });

    it('should stop monitoring', () => {
      return request(app.getHttpServer())
        .post('/api/v1/monitoring/stop')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
        });
    });
  });

  describe('Data Management', () => {
    it('should clear history', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/monitoring/history')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
        });
    });

    it('should clear alerts', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/monitoring/alerts')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
        });
    });
  });
});
```

## 🚀 端到端测试

### 1. E2E 测试场景

创建 `test/app.e2e-spec.ts`：

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Server Monitor E2E Tests', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Complete Monitoring Workflow', () => {
    it('should complete a full monitoring cycle', async () => {
      // 1. 获取初始状态
      const initialStatus = await request(app.getHttpServer())
        .get('/api/v1/status')
        .expect(200);

      expect(initialStatus.body).toHaveProperty('cpu');
      expect(initialStatus.body).toHaveProperty('mem');

      // 2. 启动监控
      await request(app.getHttpServer())
        .post('/api/v1/monitoring/start')
        .send({
          interval: 1000,
          historySize: 10,
          enableAlerts: true,
        })
        .expect(201);

      // 3. 等待数据收集
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 4. 检查监控状态
      const monitoringStatus = await request(app.getHttpServer())
        .get('/api/v1/monitoring/status')
        .expect(200);

      expect(monitoringStatus.body.status.isRunning).toBe(true);
      expect(monitoringStatus.body.status.dataPoints).toBeGreaterThan(0);

      // 5. 获取历史数据
      const history = await request(app.getHttpServer())
        .get('/api/v1/monitoring/history')
        .expect(200);

      expect(history.body.data.length).toBeGreaterThan(0);

      // 6. 获取趋势分析
      const trend = await request(app.getHttpServer())
        .get('/api/v1/monitoring/trend')
        .expect(200);

      expect(trend.body.trend).toHaveProperty('cpu');
      expect(trend.body.trend).toHaveProperty('memory');

      // 7. 停止监控
      await request(app.getHttpServer())
        .post('/api/v1/monitoring/stop')
        .expect(201);

      // 8. 验证监控已停止
      const finalStatus = await request(app.getHttpServer())
        .get('/api/v1/monitoring/status')
        .expect(200);

      expect(finalStatus.body.status.isRunning).toBe(false);
    });

    it('should handle error scenarios gracefully', async () => {
      // 测试重复启动监控
      await request(app.getHttpServer())
        .post('/api/v1/monitoring/start')
        .expect(201);

      // 再次启动应该成功（幂等操作）
      await request(app.getHttpServer())
        .post('/api/v1/monitoring/start')
        .expect(201);

      // 停止监控
      await request(app.getHttpServer())
        .post('/api/v1/monitoring/stop')
        .expect(201);

      // 重复停止应该成功
      await request(app.getHttpServer())
        .post('/api/v1/monitoring/stop')
        .expect(201);
    });
  });

  describe('API Response Format Consistency', () => {
    it('should have consistent response format across all endpoints', async () => {
      const endpoints = [
        '/api/v1/status',
        '/api/v1/status/cpu',
        '/api/v1/status/memory',
        '/api/v1/status/disk',
        '/api/v1/status/system',
      ];

      for (const endpoint of endpoints) {
        const response = await request(app.getHttpServer())
          .get(endpoint)
          .expect(200);

        expect(response.body).toHaveProperty('timestamp');
        expect(typeof response.body.timestamp).toBe('string');
        
        if (endpoint !== '/api/v1/status') {
          expect(response.body).toHaveProperty('data');
        }
      }
    });
  });
});
```

## 📊 性能测试

### 1. 负载测试

创建 `test/performance/load.test.ts`：

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { INestApplication } from '@nestjs/common';

describe('Performance Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Load Testing', () => {
    it('should handle concurrent requests', async () => {
      const concurrentRequests = 50;
      const requests = [];

      const startTime = Date.now();

      // 创建并发请求
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app.getHttpServer())
            .get('/api/v1/status')
            .expect(200)
        );
      }

      // 等待所有请求完成
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const duration = endTime - startTime;
      const avgResponseTime = duration / concurrentRequests;

      console.log(`并发请求数: ${concurrentRequests}`);
      console.log(`总耗时: ${duration}ms`);
      console.log(`平均响应时间: ${avgResponseTime.toFixed(2)}ms`);

      // 验证所有响应都成功
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('cpu');
      });

      // 性能断言
      expect(avgResponseTime).toBeLessThan(1000); // 平均响应时间应小于1秒
    });

    it('should maintain performance under sustained load', async () => {
      const requestsPerSecond = 10;
      const durationSeconds = 5;
      const totalRequests = requestsPerSecond * durationSeconds;

      const results: number[] = [];
      const startTime = Date.now();

      for (let i = 0; i < totalRequests; i++) {
        const requestStart = Date.now();
        
        await request(app.getHttpServer())
          .get('/api/v1/status/cpu')
          .expect(200);

        const requestEnd = Date.now();
        results.push(requestEnd - requestStart);

        // 控制请求频率
        if (i < totalRequests - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, 1000 / requestsPerSecond)
          );
        }
      }

      const totalTime = Date.now() - startTime;
      const avgResponseTime = results.reduce((a, b) => a + b, 0) / results.length;
      const maxResponseTime = Math.max(...results);
      const minResponseTime = Math.min(...results);

      console.log(`持续负载测试结果:`);
      console.log(`总请求数: ${totalRequests}`);
      console.log(`总耗时: ${totalTime}ms`);
      console.log(`平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`最大响应时间: ${maxResponseTime}ms`);
      console.log(`最小响应时间: ${minResponseTime}ms`);

      // 性能断言
      expect(avgResponseTime).toBeLessThan(500);
      expect(maxResponseTime).toBeLessThan(2000);
    });
  });

  describe('Memory Usage Testing', () => {
    it('should not have memory leaks during extended operation', async () => {
      const initialMemory = process.memoryUsage();
      
      // 启动监控
      await request(app.getHttpServer())
        .post('/api/v1/monitoring/start')
        .send({ interval: 100 })
        .expect(201);

      // 运行一段时间
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 执行多次请求
      for (let i = 0; i < 100; i++) {
        await request(app.getHttpServer())
          .get('/api/v1/monitoring/history')
          .expect(200);
      }

      // 停止监控
      await request(app.getHttpServer())
        .post('/api/v1/monitoring/stop')
        .expect(201);

      // 强制垃圾回收
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`初始内存使用: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`最终内存使用: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`内存增长: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);

      // 内存增长不应超过 50MB
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});
```

### 2. 压力测试脚本

创建 `scripts/stress-test.js`：

```javascript
const http = require('http');
const { performance } = require('perf_hooks');

class StressTest {
  constructor(options = {}) {
    this.host = options.host || 'localhost';
    this.port = options.port || 3000;
    this.path = options.path || '/api/v1/status';
    this.concurrency = options.concurrency || 10;
    this.duration = options.duration || 30000; // 30秒
    this.results = [];
  }

  async run() {
    console.log(`开始压力测试:`);
    console.log(`目标: http://${this.host}:${this.port}${this.path}`);
    console.log(`并发数: ${this.concurrency}`);
    console.log(`持续时间: ${this.duration}ms`);
    console.log('');

    const startTime = performance.now();
    const endTime = startTime + this.duration;
    const workers = [];

    // 启动并发工作者
    for (let i = 0; i < this.concurrency; i++) {
      workers.push(this.worker(endTime));
    }

    // 等待所有工作者完成
    await Promise.all(workers);

    this.printResults();
  }

  async worker(endTime) {
    while (performance.now() < endTime) {
      const requestStart = performance.now();
      
      try {
        await this.makeRequest();
        const requestEnd = performance.now();
        
        this.results.push({
          success: true,
          duration: requestEnd - requestStart,
          timestamp: requestEnd,
        });
      } catch (error) {
        this.results.push({
          success: false,
          error: error.message,
          timestamp: performance.now(),
        });
      }
    }
  }

  makeRequest() {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: this.host,
        port: this.port,
        path: this.path,
        method: 'GET',
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }

  printResults() {
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    if (successful.length === 0) {
      console.log('没有成功的请求');
      return;
    }

    const durations = successful.map(r => r.duration);
    const totalRequests = this.results.length;
    const successRate = (successful.length / totalRequests) * 100;
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    // 计算百分位数
    const sortedDurations = durations.sort((a, b) => a - b);
    const p50 = sortedDurations[Math.floor(sortedDurations.length * 0.5)];
    const p95 = sortedDurations[Math.floor(sortedDurations.length * 0.95)];
    const p99 = sortedDurations[Math.floor(sortedDurations.length * 0.99)];

    console.log('压力测试结果:');
    console.log('================');
    console.log(`总请求数: ${totalRequests}`);
    console.log(`成功请求: ${successful.length}`);
    console.log(`失败请求: ${failed.length}`);
    console.log(`成功率: ${successRate.toFixed(2)}%`);
    console.log(`平均响应时间: ${avgDuration.toFixed(2)}ms`);
    console.log(`最小响应时间: ${minDuration.toFixed(2)}ms`);
    console.log(`最大响应时间: ${maxDuration.toFixed(2)}ms`);
    console.log(`P50 响应时间: ${p50.toFixed(2)}ms`);
    console.log(`P95 响应时间: ${p95.toFixed(2)}ms`);
    console.log(`P99 响应时间: ${p99.toFixed(2)}ms`);
    console.log(`QPS: ${(successful.length / (this.duration / 1000)).toFixed(2)}`);
  }
}

// 运行压力测试
if (require.main === module) {
  const test = new StressTest({
    concurrency: 20,
    duration: 60000, // 1分钟
  });
  
  test.run().catch(console.error);
}

module.exports = StressTest;
```

## 🤖 自动化测试

### 1. GitHub Actions 配置

创建 `.github/workflows/test.yml`：

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run unit tests
      run: npm run test
    
    - name: Run e2e tests
      run: npm run test:e2e
    
    - name: Generate coverage report
      run: npm run test:cov
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
```

### 2. 测试脚本配置

更新 `package.json` 中的测试脚本：

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "test:integration": "jest --config ./test/jest-integration.json",
    "test:performance": "jest --config ./test/jest-performance.json",
    "test:all": "npm run test && npm run test:e2e && npm run test:integration"
  }
}
```

## 🎉 小结

在这一章中，我们学习了：

1. **测试类型**：单元测试、集成测试、E2E 测试的区别和用途
2. **单元测试**：测试工具函数和控制器的具体实现
3. **集成测试**：测试模块间的交互和 API 集成
4. **E2E 测试**：测试完整的用户场景和工作流程
5. **性能测试**：负载测试、压力测试和内存泄漏检测
6. **自动化测试**：CI/CD 流程和测试自动化

## 🔗 下一步

现在您已经掌握了 API 测试的各个方面，接下来我们将学习 [错误处理](./11-error-handling.md)，了解如何构建健壮的错误处理机制。

## 💡 常见问题

### Q: 如何选择合适的测试策略？

A: 遵循测试金字塔原则：
- **大量单元测试**: 快速、稳定、易维护
- **适量集成测试**: 验证组件协作
- **少量 E2E 测试**: 验证关键用户场景

### Q: 如何提高测试覆盖率？

A: 关注以下方面：
- **代码覆盖率**: 确保所有代码路径被测试
- **分支覆盖率**: 测试所有条件分支
- **功能覆盖率**: 测试所有功能需求
- **边界测试**: 测试边界条件和异常情况

### Q: 性能测试的指标如何设定？

A: 常见性能指标：
- **响应时间**: P50 < 100ms, P95 < 500ms, P99 < 1s
- **吞吐量**: 根据业务需求设定 QPS
- **错误率**: < 0.1%
- **资源使用**: CPU < 70%, 内存稳定

### Q: 如何处理测试中的异步操作？

A: 异步测试最佳实践：
- 使用 `async/await` 而不是回调
- 设置合理的超时时间
- 使用 `jest.setTimeout()` 调整测试超时
- 正确清理异步资源
