# 服务器监控 API - NestJS 教学示例

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

一个基于 NestJS 框架的服务器状态监控 API 教学示例，展示如何使用 Node.js 获取系统资源信息（CPU、内存、磁盘、系统信息）。

## 📋 项目简介

本项目是一个完整的服务器监控解决方案教学示例，通过 RESTful API 提供实时的服务器状态信息。项目使用 TypeScript 编写，代码结构清晰，注释详细，适合学习和实际应用。

## ✨ 功能特性

- **CPU 监控**：获取 CPU 核心数、使用率（用户、系统、空闲）
- **内存监控**：获取总内存、已用内存、空闲内存和使用率
- **磁盘监控**：获取所有磁盘分区的使用情况
- **系统信息**：获取主机名、IP 地址、操作系统类型和架构
- **动态 CPU 监控**：通过双采样计算更精确的 CPU 使用率
- **多接口支持**：提供综合接口和单独的资源监控接口
- **跨平台支持**：支持 Windows、Linux、macOS

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm 或 pnpm

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm
pnpm install
```

### 运行项目

```bash
# 开发模式（热重载）
npm run start:dev

# 生产模式
npm run start:prod

# 调试模式
npm run start:debug
```

项目启动后，访问 `http://localhost:3000` 即可使用 API。

## 📚 API 接口文档

### 1. 获取完整服务器状态

```http
GET /status
```

**响应示例：**
```json
{
  "cpu": {
    "cpuNum": 8,
    "sys": "12.34%",
    "used": "45.67%",
    "free": "41.99%"
  },
  "mem": {
    "total": "16.00 GB",
    "used": "9.50 GB",
    "free": "6.50 GB",
    "usage": "59.38%"
  },
  "disk": [
    {
      "mounted": "/",
      "filesystem": "ext4",
      "total": "100.00 GB",
      "used": "60.00 GB",
      "free": "40.00 GB",
      "usage": "60%"
    }
  ],
  "sys": {
    "computerName": "my-server",
    "computerIp": "192.168.1.100",
    "osName": "linux",
    "osArch": "x64"
  }
}
```

### 2. 获取 CPU 信息

```http
GET /status/cpu
```

**响应示例：**
```json
{
  "cpuNum": 8,
  "sys": "12.34%",
  "used": "45.67%",
  "free": "41.99%"
}
```

### 3. 获取动态 CPU 使用率

```http
GET /status/cpu-dynamic
```

> ⚠️ **注意**：此接口需要等待 1 秒进行双采样，响应时间较长但数据更准确。

### 4. 获取内存信息

```http
GET /status/memory
```

**响应示例：**
```json
{
  "total": "16.00 GB",
  "used": "9.50 GB",
  "free": "6.50 GB",
  "usage": "59.38%"
}
```

### 5. 获取磁盘信息

```http
GET /status/disk
```

**响应示例：**
```json
[
  {
    "mounted": "/",
    "filesystem": "ext4",
    "total": "100.00 GB",
    "used": "60.00 GB",
    "free": "40.00 GB",
    "usage": "60%"
  }
]
```

### 6. 获取系统信息

```http
GET /status/system
```

**响应示例：**
```json
{
  "computerName": "my-server",
  "computerIp": "192.168.1.100",
  "osName": "linux",
  "osArch": "x64"
}
```

## 🏗️ 项目结构

```
src/
├── app.controller.ts      # 主控制器，包含所有监控接口
├── app.module.ts          # 应用模块
├── app.service.ts         # 应用服务
├── main.ts               # 应用入口文件
└── utils/
    └── system-info.ts    # 系统信息获取工具函数
```

## 🔧 核心技术实现

### CPU 监控原理

使用 Node.js 内置的 `os.cpus()` 方法获取 CPU 信息：

```typescript
const cpus = os.cpus();
const totalInfo = cpus.reduce((acc, cpu) => {
  acc.user += cpu.times.user;
  acc.sys += cpu.times.sys;
  acc.idle += cpu.times.idle;
  return acc;
}, { user: 0, sys: 0, idle: 0 });
```

### 内存监控原理

使用 `os.totalmem()` 和 `os.freemem()` 获取内存信息：

```typescript
const totalMemory = os.totalmem();
const freeMemory = os.freemem();
const usedMemory = totalMemory - freeMemory;
```

### 磁盘监控原理

使用 `node-disk-info` 库获取跨平台的磁盘信息：

```typescript
import * as nodeDiskInfo from 'node-disk-info';
const disks = await nodeDiskInfo.getDiskInfo();
```

### 动态 CPU 监控

通过两次采样计算 CPU 使用率变化：

```typescript
const start = getCpuTimes();
await new Promise(resolve => setTimeout(resolve, 1000));
const end = getCpuTimes();
// 计算差值得到更准确的使用率
```

## 🧪 测试

```bash
# 单元测试
npm run test

# 端到端测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
```

## 📦 依赖说明

### 核心依赖

- **@nestjs/common**: NestJS 核心模块
- **@nestjs/core**: NestJS 核心功能
- **@nestjs/platform-express**: Express 平台适配器
- **node-disk-info**: 跨平台磁盘信息获取库
- **reflect-metadata**: 装饰器元数据支持
- **rxjs**: 响应式编程库

### 开发依赖

- **TypeScript**: 类型安全的 JavaScript 超集
- **Jest**: 测试框架
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化

## 🚀 扩展建议

### 1. 实时监控

使用 WebSocket 实现实时数据推送：

```typescript
@WebSocketGateway()
export class MonitorGateway {
  @SubscribeMessage('monitor')
  handleMonitor(client: any, payload: any): void {
    // 定时推送监控数据
  }
}
```

### 2. 数据可视化

集成图表库（如 Chart.js 或 ECharts）：

```html
<canvas id="cpuChart"></canvas>
<script>
  // 使用 Chart.js 绘制 CPU 使用率图表
</script>
```

### 3. 历史数据存储

添加数据库存储历史监控数据：

```typescript
@Entity()
export class MonitorRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  timestamp: Date;

  @Column('json')
  data: any;
}
```

### 4. 告警系统

添加阈值监控和告警：

```typescript
export class AlertService {
  checkThresholds(data: any) {
    if (parseFloat(data.cpu.used) > 80) {
      this.sendAlert('CPU 使用率过高');
    }
  }
}
```

### 5. 网络监控

扩展网络流量监控功能：

```bash
npm install node-netstat
```

## 📚 学习要点

### 第一步：获取 CPU 使用情况

CPU 是服务器的核心，我们通过 Node.js 的 `os.cpus()` 方法获取 CPU 信息。核心思路是利用 `os.cpus().times` 提供的 `user`（用户进程时间）、`sys`（系统内核时间）和 `idle`（空闲时间），通过它们计算百分比。

### 第二步：监控内存状态

内存是另一个关键指标。Node.js 的 os 模块提供了 `os.totalmem()`（总内存）和 `os.freemem()`（空闲内存）两个方法，单位是字节。为了让数据更易读，我们将字节转换为 GB。

### 第三步：检查磁盘空间

Node.js 的 os 模块不直接提供磁盘信息，但 `node-disk-info` 是一个轻量级的库，可以帮我们轻松获取磁盘数据。它支持 Windows、Linux 和 macOS，能够返回每个磁盘分区的使用情况。

### 第四步：收集系统基本信息

为了让监控 API 更全面，我们添加了系统基本信息，比如主机名、IP 地址和操作系统类型。

### 第五步：整合到 NestJS API

将所有函数整合到一个 NestJS 控制器中，创建多个接口，返回不同的服务器状态信息。

### 第六步：动态监控 CPU 使用率

通过多次采样计算变化率，获取更精确的 CPU 使用率数据。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 [Issue](https://github.com/your-repo/issues)
- 发送邮件至：your-email@example.com

---

**Happy Coding! 🎉**
