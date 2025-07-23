# 04 - CPU 监控

本章将详细介绍如何实现 CPU 使用率监控功能，这是服务器监控系统的核心组件之一。

## 🎯 学习目标

- 理解 CPU 监控的基本原理
- 学会使用 Node.js 内置 os 模块获取 CPU 信息
- 掌握 CPU 使用率的计算方法
- 实现静态和动态 CPU 监控功能
- 了解跨平台兼容性处理

## 🧠 CPU 监控原理

### CPU 时间类型

操作系统将 CPU 时间分为三种主要类型：

1. **User Time (用户时间)**: CPU 执行用户进程的时间
2. **System Time (系统时间)**: CPU 执行系统内核代码的时间  
3. **Idle Time (空闲时间)**: CPU 处于空闲状态的时间

### 使用率计算公式

```
CPU 使用率 = (User Time + System Time) / (User Time + System Time + Idle Time) × 100%
用户使用率 = User Time / Total Time × 100%
系统使用率 = System Time / Total Time × 100%
空闲率 = Idle Time / Total Time × 100%
```

## 📊 Node.js os 模块详解

### os.cpus() 方法

Node.js 提供了 `os.cpus()` 方法来获取 CPU 信息：

```typescript
import * as os from 'os';

const cpus = os.cpus();
console.log(cpus);
```

**返回数据结构：**
```typescript
interface CpuInfo {
  model: string;    // CPU 型号
  speed: number;    // CPU 频率 (MHz)
  times: {
    user: number;   // 用户进程时间 (毫秒)
    nice: number;   // 低优先级用户进程时间 (毫秒)
    sys: number;    // 系统内核时间 (毫秒)
    idle: number;   // 空闲时间 (毫秒)
    irq: number;    // 硬中断时间 (毫秒)
  };
}
```

### 示例输出

```javascript
[
  {
    model: 'Intel(R) Core(TM) i7-8750H CPU @ 2.20GHz',
    speed: 2208,
    times: {
      user: 252020,
      nice: 0,
      sys: 30340,
      idle: 1070356870,
      irq: 0
    }
  },
  // ... 其他 CPU 核心
]
```

## 🔧 实现静态 CPU 监控

### 基础实现

创建 `src/utils/system-info.ts` 文件：

```typescript
import * as os from 'os';

/**
 * 获取 CPU 信息
 * @returns CPU 使用情况对象
 */
export function getCpuInfo() {
  const cpus = os.cpus();
  
  // 累加所有核心的时间
  const totalInfo = cpus.reduce(
    (acc, cpu) => {
      acc.user += cpu.times.user;
      acc.sys += cpu.times.sys;
      acc.idle += cpu.times.idle;
      return acc;
    },
    { user: 0, sys: 0, idle: 0 },
  );

  const total = totalInfo.user + totalInfo.sys + totalInfo.idle;

  return {
    cpuNum: cpus.length, // CPU 核心数
    sys: ((totalInfo.sys / total) * 100).toFixed(2) + '%', // 系统使用率
    used: ((totalInfo.user / total) * 100).toFixed(2) + '%', // 用户使用率
    free: ((totalInfo.idle / total) * 100).toFixed(2) + '%', // 空闲率
  };
}
```

### 详细解析

**1. 获取所有 CPU 核心信息**
```typescript
const cpus = os.cpus();
```

**2. 累加所有核心的时间**
```typescript
const totalInfo = cpus.reduce(
  (acc, cpu) => {
    acc.user += cpu.times.user;
    acc.sys += cpu.times.sys;
    acc.idle += cpu.times.idle;
    return acc;
  },
  { user: 0, sys: 0, idle: 0 },
);
```

**3. 计算总时间**
```typescript
const total = totalInfo.user + totalInfo.sys + totalInfo.idle;
```

**4. 计算各种使用率**
```typescript
const sysUsage = (totalInfo.sys / total) * 100;
const userUsage = (totalInfo.user / total) * 100;
const idleUsage = (totalInfo.idle / total) * 100;
```

## ⚡ 实现动态 CPU 监控

静态监控只能获取系统启动以来的累计数据，动态监控通过两次采样计算实时使用率。

### 动态监控实现

```typescript
/**
 * 获取动态 CPU 使用率（通过两次采样计算）
 * @returns CPU 动态使用情况对象
 */
export async function getDynamicCpuUsage() {
  function getCpuTimes() {
    return os.cpus().reduce(
      (acc, cpu) => {
        acc.user += cpu.times.user;
        acc.sys += cpu.times.sys;
        acc.idle += cpu.times.idle;
        return acc;
      },
      { user: 0, sys: 0, idle: 0 },
    );
  }

  // 第一次采样
  const start = getCpuTimes();
  
  // 等待 1 秒
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  // 第二次采样
  const end = getCpuTimes();

  // 计算时间差
  const delta = {
    user: end.user - start.user,
    sys: end.sys - start.sys,
    idle: end.idle - start.idle,
  };
  
  const total = delta.user + delta.sys + delta.idle;

  return {
    cpuNum: os.cpus().length,
    sys: ((delta.sys / total) * 100).toFixed(2) + '%',
    used: ((delta.user / total) * 100).toFixed(2) + '%',
    free: ((delta.idle / total) * 100).toFixed(2) + '%',
  };
}
```

### 动态监控原理

1. **第一次采样**: 记录当前 CPU 时间
2. **等待间隔**: 通常等待 1 秒
3. **第二次采样**: 再次记录 CPU 时间
4. **计算差值**: 两次采样的时间差
5. **计算使用率**: 基于时间差计算实时使用率

## 🧪 测试 CPU 监控功能

### 创建测试文件

创建 `src/utils/cpu-test.ts`：

```typescript
import { getCpuInfo, getDynamicCpuUsage } from './system-info';

async function testCpuMonitoring() {
  console.log('🔍 测试 CPU 监控功能\n');

  // 测试静态 CPU 信息
  console.log('📊 静态 CPU 信息：');
  const staticCpuInfo = getCpuInfo();
  console.log('CPU 核心数:', staticCpuInfo.cpuNum);
  console.log('系统使用率:', staticCpuInfo.sys);
  console.log('用户使用率:', staticCpuInfo.used);
  console.log('空闲率:', staticCpuInfo.free);
  console.log('');

  // 测试动态 CPU 信息
  console.log('⚡ 动态 CPU 信息（需要等待 1 秒）：');
  const dynamicCpuInfo = await getDynamicCpuUsage();
  console.log('CPU 核心数:', dynamicCpuInfo.cpuNum);
  console.log('系统使用率:', dynamicCpuInfo.sys);
  console.log('用户使用率:', dynamicCpuInfo.used);
  console.log('空闲率:', dynamicCpuInfo.free);
  console.log('');

  // 比较两种方法的差异
  console.log('📈 对比分析：');
  console.log('静态监控 - 用户使用率:', staticCpuInfo.used);
  console.log('动态监控 - 用户使用率:', dynamicCpuInfo.used);
}

// 运行测试
if (require.main === module) {
  testCpuMonitoring().catch(console.error);
}
```

### 运行测试

```bash
npx ts-node src/utils/cpu-test.ts
```

## 🎨 优化和扩展

### 1. 添加 CPU 型号信息

```typescript
export function getCpuDetailInfo() {
  const cpus = os.cpus();
  const firstCpu = cpus[0];
  
  return {
    model: firstCpu.model,           // CPU 型号
    speed: firstCpu.speed,           // CPU 频率
    cores: cpus.length,              // 核心数
    architecture: os.arch(),         // 架构
    ...getCpuInfo()                  // 使用率信息
  };
}
```

### 2. 添加负载平均值（仅 Unix 系统）

```typescript
export function getLoadAverage() {
  const loadavg = os.loadavg();
  return {
    '1min': loadavg[0].toFixed(2),   // 1分钟平均负载
    '5min': loadavg[1].toFixed(2),   // 5分钟平均负载
    '15min': loadavg[2].toFixed(2),  // 15分钟平均负载
  };
}
```

### 3. CPU 使用率历史记录

```typescript
class CpuMonitor {
  private history: Array<{timestamp: number, usage: number}> = [];
  private maxHistorySize = 60; // 保留最近60次记录

  async recordUsage() {
    const cpuInfo = await getDynamicCpuUsage();
    const usage = parseFloat(cpuInfo.used.replace('%', ''));
    
    this.history.push({
      timestamp: Date.now(),
      usage: usage
    });

    // 保持历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  getHistory() {
    return this.history;
  }

  getAverageUsage(minutes: number = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recentData = this.history.filter(item => item.timestamp > cutoff);
    
    if (recentData.length === 0) return 0;
    
    const sum = recentData.reduce((acc, item) => acc + item.usage, 0);
    return (sum / recentData.length).toFixed(2);
  }
}
```

## 🔍 跨平台兼容性

### Windows 特殊处理

Windows 系统的 CPU 时间计算可能有所不同：

```typescript
function isWindows(): boolean {
  return os.platform() === 'win32';
}

export function getCpuInfoCrossPlatform() {
  const cpuInfo = getCpuInfo();
  
  if (isWindows()) {
    // Windows 特殊处理逻辑
    console.log('Windows 系统 CPU 监控');
  }
  
  return cpuInfo;
}
```

### 错误处理

```typescript
export function getCpuInfoSafe() {
  try {
    return getCpuInfo();
  } catch (error) {
    console.error('获取 CPU 信息失败:', error);
    return {
      cpuNum: 0,
      sys: '0%',
      used: '0%',
      free: '100%',
      error: '无法获取 CPU 信息'
    };
  }
}
```

## 📈 性能考虑

### 1. 缓存机制

```typescript
class CpuInfoCache {
  private cache: any = null;
  private lastUpdate: number = 0;
  private cacheTimeout: number = 1000; // 1秒缓存

  getCpuInfo() {
    const now = Date.now();
    
    if (!this.cache || (now - this.lastUpdate) > this.cacheTimeout) {
      this.cache = getCpuInfo();
      this.lastUpdate = now;
    }
    
    return this.cache;
  }
}
```

### 2. 异步优化

```typescript
export async function getCpuInfoAsync(): Promise<any> {
  return new Promise((resolve) => {
    // 使用 setImmediate 避免阻塞事件循环
    setImmediate(() => {
      resolve(getCpuInfo());
    });
  });
}
```

## 🎉 小结

在这一章中，我们学习了：

1. **CPU 监控原理**：理解 CPU 时间类型和使用率计算
2. **静态监控**：获取系统启动以来的累计 CPU 使用情况
3. **动态监控**：通过双采样获取实时 CPU 使用率
4. **功能扩展**：添加 CPU 详细信息和历史记录
5. **性能优化**：缓存机制和异步处理
6. **跨平台兼容**：处理不同操作系统的差异

## 🔗 下一步

现在您已经掌握了 CPU 监控的实现，接下来我们将学习 [内存监控](./05-memory-monitoring.md)，了解如何获取和处理内存使用情况。

## 💡 常见问题

### Q: 为什么静态和动态监控的结果不同？

A: 静态监控显示的是系统启动以来的累计平均值，而动态监控显示的是当前时刻的实时使用率，更能反映当前系统状态。

### Q: 采样间隔应该设置多长？

A: 通常 1 秒是一个好的平衡点。太短可能不够准确，太长则不够实时。可以根据具体需求调整。

### Q: 如何处理多核 CPU？

A: `os.cpus()` 返回每个核心的信息，我们通过累加所有核心的时间来计算整体使用率。

### Q: CPU 使用率为什么有时会超过 100%？

A: 这通常是由于计算精度或系统时间跳跃导致的。可以添加边界检查来限制结果在 0-100% 范围内。
