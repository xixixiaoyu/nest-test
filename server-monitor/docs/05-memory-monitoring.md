# 05 - 内存监控

本章将详细介绍如何实现内存使用情况监控功能，包括总内存、已用内存、空闲内存和使用率的获取与计算。

## 🎯 学习目标

- 理解内存监控的基本概念
- 学会使用 Node.js os 模块获取内存信息
- 掌握内存使用率的计算方法
- 实现内存信息的格式化显示
- 了解不同操作系统的内存管理差异

## 🧠 内存监控基础

### 内存类型概念

现代操作系统中的内存可以分为：

1. **物理内存 (Physical Memory)**: 实际的 RAM 硬件
2. **虚拟内存 (Virtual Memory)**: 包括物理内存和交换空间
3. **可用内存 (Available Memory)**: 可以立即分配给进程的内存
4. **已用内存 (Used Memory)**: 当前被进程占用的内存

### 内存使用率计算

```
内存使用率 = (总内存 - 空闲内存) / 总内存 × 100%
已用内存 = 总内存 - 空闲内存
```

## 📊 Node.js 内存 API

### os.totalmem() 和 os.freemem()

Node.js 提供了两个核心方法来获取内存信息：

```typescript
import * as os from 'os';

const totalMemory = os.totalmem();  // 总内存（字节）
const freeMemory = os.freemem();    // 空闲内存（字节）
```

**返回值说明：**
- 返回值单位为字节 (bytes)
- `totalmem()`: 系统总物理内存
- `freemem()`: 当前可用的空闲内存

### 示例输出

```javascript
console.log('总内存:', os.totalmem());     // 17179869184 (16GB)
console.log('空闲内存:', os.freemem());    // 8589934592 (8GB)
```

## 🔧 实现内存监控功能

### 基础实现

在 `src/utils/system-info.ts` 中添加内存监控函数：

```typescript
import * as os from 'os';

/**
 * 将字节转换为 GB
 * @param bytes 字节数
 * @returns 格式化的 GB 字符串
 */
function bytesToGB(bytes: number): string {
  return (bytes / (1024 * 1024 * 1024)).toFixed(2);
}

/**
 * 获取内存信息
 * @returns 内存使用情况对象
 */
export function getMemInfo() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  return {
    total: `${bytesToGB(totalMemory)} GB`, // 总内存
    used: `${bytesToGB(usedMemory)} GB`, // 已用内存
    free: `${bytesToGB(freeMemory)} GB`, // 空闲内存
    usage: ((usedMemory / totalMemory) * 100).toFixed(2) + '%', // 使用率
  };
}
```

### 详细解析

**1. 单位转换函数**
```typescript
function bytesToGB(bytes: number): string {
  return (bytes / (1024 * 1024 * 1024)).toFixed(2);
}
```
- 将字节转换为 GB（1024³）
- 保留两位小数
- 返回格式化字符串

**2. 内存计算**
```typescript
const totalMemory = os.totalmem();        // 获取总内存
const freeMemory = os.freemem();          // 获取空闲内存
const usedMemory = totalMemory - freeMemory; // 计算已用内存
```

**3. 使用率计算**
```typescript
const usage = (usedMemory / totalMemory) * 100;
```

## 🎨 扩展内存监控功能

### 1. 多单位支持

```typescript
/**
 * 内存单位枚举
 */
enum MemoryUnit {
  BYTES = 'bytes',
  KB = 'KB',
  MB = 'MB',
  GB = 'GB',
  TB = 'TB'
}

/**
 * 转换字节到指定单位
 * @param bytes 字节数
 * @param unit 目标单位
 * @returns 转换后的数值和单位
 */
function convertBytes(bytes: number, unit: MemoryUnit): string {
  const units = {
    [MemoryUnit.BYTES]: 1,
    [MemoryUnit.KB]: 1024,
    [MemoryUnit.MB]: 1024 * 1024,
    [MemoryUnit.GB]: 1024 * 1024 * 1024,
    [MemoryUnit.TB]: 1024 * 1024 * 1024 * 1024,
  };

  const value = bytes / units[unit];
  return `${value.toFixed(2)} ${unit}`;
}

/**
 * 获取详细内存信息
 * @param unit 显示单位
 * @returns 内存详细信息
 */
export function getDetailedMemInfo(unit: MemoryUnit = MemoryUnit.GB) {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  return {
    total: {
      bytes: totalMemory,
      formatted: convertBytes(totalMemory, unit)
    },
    used: {
      bytes: usedMemory,
      formatted: convertBytes(usedMemory, unit)
    },
    free: {
      bytes: freeMemory,
      formatted: convertBytes(freeMemory, unit)
    },
    usage: {
      percentage: ((usedMemory / totalMemory) * 100).toFixed(2) + '%',
      ratio: `${usedMemory}/${totalMemory}`
    }
  };
}
```

### 2. 内存状态评估

```typescript
/**
 * 内存状态枚举
 */
enum MemoryStatus {
  LOW = 'low',        // 内存充足
  MEDIUM = 'medium',  // 内存适中
  HIGH = 'high',      // 内存紧张
  CRITICAL = 'critical' // 内存严重不足
}

/**
 * 评估内存状态
 * @returns 内存状态信息
 */
export function getMemoryStatus() {
  const memInfo = getMemInfo();
  const usagePercent = parseFloat(memInfo.usage.replace('%', ''));
  
  let status: MemoryStatus;
  let message: string;
  let color: string;

  if (usagePercent < 50) {
    status = MemoryStatus.LOW;
    message = '内存使用正常';
    color = 'green';
  } else if (usagePercent < 70) {
    status = MemoryStatus.MEDIUM;
    message = '内存使用适中';
    color = 'yellow';
  } else if (usagePercent < 90) {
    status = MemoryStatus.HIGH;
    message = '内存使用较高';
    color = 'orange';
  } else {
    status = MemoryStatus.CRITICAL;
    message = '内存严重不足';
    color = 'red';
  }

  return {
    ...memInfo,
    status,
    message,
    color,
    usagePercent
  };
}
```

### 3. 内存历史监控

```typescript
/**
 * 内存历史记录接口
 */
interface MemoryRecord {
  timestamp: number;
  total: number;
  used: number;
  free: number;
  usage: number;
}

/**
 * 内存监控器类
 */
class MemoryMonitor {
  private history: MemoryRecord[] = [];
  private maxHistorySize: number = 100;
  private monitorInterval: NodeJS.Timeout | null = null;

  /**
   * 开始监控
   * @param intervalMs 监控间隔（毫秒）
   */
  startMonitoring(intervalMs: number = 5000) {
    this.monitorInterval = setInterval(() => {
      this.recordMemoryUsage();
    }, intervalMs);
  }

  /**
   * 停止监控
   */
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  /**
   * 记录内存使用情况
   */
  private recordMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usage = (usedMemory / totalMemory) * 100;

    const record: MemoryRecord = {
      timestamp: Date.now(),
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      usage: usage
    };

    this.history.push(record);

    // 保持历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * 获取历史记录
   * @param count 获取记录数量
   * @returns 历史记录数组
   */
  getHistory(count?: number): MemoryRecord[] {
    if (count) {
      return this.history.slice(-count);
    }
    return [...this.history];
  }

  /**
   * 获取平均内存使用率
   * @param minutes 时间范围（分钟）
   * @returns 平均使用率
   */
  getAverageUsage(minutes: number = 5): number {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recentRecords = this.history.filter(record => record.timestamp > cutoff);
    
    if (recentRecords.length === 0) return 0;
    
    const totalUsage = recentRecords.reduce((sum, record) => sum + record.usage, 0);
    return totalUsage / recentRecords.length;
  }

  /**
   * 获取内存使用趋势
   * @returns 趋势信息
   */
  getTrend(): { direction: 'up' | 'down' | 'stable', change: number } {
    if (this.history.length < 2) {
      return { direction: 'stable', change: 0 };
    }

    const recent = this.history.slice(-10); // 最近10次记录
    const firstUsage = recent[0].usage;
    const lastUsage = recent[recent.length - 1].usage;
    const change = lastUsage - firstUsage;

    let direction: 'up' | 'down' | 'stable';
    if (Math.abs(change) < 1) {
      direction = 'stable';
    } else if (change > 0) {
      direction = 'up';
    } else {
      direction = 'down';
    }

    return { direction, change: Math.abs(change) };
  }
}
```

## 🧪 测试内存监控功能

### 创建测试文件

创建 `src/utils/memory-test.ts`：

```typescript
import { 
  getMemInfo, 
  getDetailedMemInfo, 
  getMemoryStatus, 
  MemoryUnit 
} from './system-info';

async function testMemoryMonitoring() {
  console.log('🔍 测试内存监控功能\n');

  // 基础内存信息
  console.log('📊 基础内存信息：');
  const basicMemInfo = getMemInfo();
  console.log('总内存:', basicMemInfo.total);
  console.log('已用内存:', basicMemInfo.used);
  console.log('空闲内存:', basicMemInfo.free);
  console.log('使用率:', basicMemInfo.usage);
  console.log('');

  // 详细内存信息
  console.log('📈 详细内存信息（MB 单位）：');
  const detailedMemInfo = getDetailedMemInfo(MemoryUnit.MB);
  console.log('总内存:', detailedMemInfo.total.formatted);
  console.log('已用内存:', detailedMemInfo.used.formatted);
  console.log('空闲内存:', detailedMemInfo.free.formatted);
  console.log('');

  // 内存状态评估
  console.log('🚦 内存状态评估：');
  const memoryStatus = getMemoryStatus();
  console.log('状态:', memoryStatus.status);
  console.log('消息:', memoryStatus.message);
  console.log('使用率:', memoryStatus.usagePercent + '%');
  console.log('');

  // 内存压力测试（创建大数组）
  console.log('⚡ 内存压力测试：');
  const beforeTest = getMemInfo();
  console.log('测试前使用率:', beforeTest.usage);

  // 创建大数组占用内存
  const bigArray = new Array(1000000).fill('test data');
  
  const afterTest = getMemInfo();
  console.log('测试后使用率:', afterTest.usage);
  
  // 清理内存
  bigArray.length = 0;
  
  // 强制垃圾回收（如果可用）
  if (global.gc) {
    global.gc();
  }
  
  const afterCleanup = getMemInfo();
  console.log('清理后使用率:', afterCleanup.usage);
}

// 运行测试
if (require.main === module) {
  testMemoryMonitoring().catch(console.error);
}
```

### 运行测试

```bash
# 普通运行
npx ts-node src/utils/memory-test.ts

# 启用垃圾回收（可选）
node --expose-gc -r ts-node/register src/utils/memory-test.ts
```

## 🔍 跨平台兼容性

### 不同操作系统的内存管理

```typescript
/**
 * 获取平台特定的内存信息
 */
export function getPlatformMemoryInfo() {
  const platform = os.platform();
  const basicInfo = getMemInfo();
  
  let platformSpecific: any = {};
  
  switch (platform) {
    case 'linux':
      platformSpecific = getLinuxMemoryInfo();
      break;
    case 'darwin':
      platformSpecific = getMacOSMemoryInfo();
      break;
    case 'win32':
      platformSpecific = getWindowsMemoryInfo();
      break;
    default:
      platformSpecific = { note: '平台特定信息不可用' };
  }
  
  return {
    ...basicInfo,
    platform,
    platformSpecific
  };
}

function getLinuxMemoryInfo() {
  // Linux 特定的内存信息
  return {
    note: 'Linux 系统内存信息',
    // 可以通过读取 /proc/meminfo 获取更详细信息
  };
}

function getMacOSMemoryInfo() {
  // macOS 特定的内存信息
  return {
    note: 'macOS 系统内存信息',
    // 可以通过 vm_stat 命令获取更详细信息
  };
}

function getWindowsMemoryInfo() {
  // Windows 特定的内存信息
  return {
    note: 'Windows 系统内存信息',
    // 可以通过 WMI 获取更详细信息
  };
}
```

## 📈 性能优化

### 1. 内存信息缓存

```typescript
class MemoryInfoCache {
  private cache: any = null;
  private lastUpdate: number = 0;
  private cacheTimeout: number = 1000; // 1秒缓存

  getMemInfo() {
    const now = Date.now();
    
    if (!this.cache || (now - this.lastUpdate) > this.cacheTimeout) {
      this.cache = getMemInfo();
      this.lastUpdate = now;
    }
    
    return this.cache;
  }

  clearCache() {
    this.cache = null;
    this.lastUpdate = 0;
  }
}
```

### 2. 异步内存监控

```typescript
export async function getMemInfoAsync(): Promise<any> {
  return new Promise((resolve) => {
    setImmediate(() => {
      resolve(getMemInfo());
    });
  });
}
```

## 🎉 小结

在这一章中，我们学习了：

1. **内存监控基础**：理解内存类型和使用率计算
2. **基础实现**：使用 Node.js os 模块获取内存信息
3. **功能扩展**：多单位支持、状态评估、历史监控
4. **测试验证**：创建测试用例验证功能正确性
5. **跨平台兼容**：处理不同操作系统的差异
6. **性能优化**：缓存机制和异步处理

## 🔗 下一步

现在您已经掌握了内存监控的实现，接下来我们将学习 [磁盘监控](./06-disk-monitoring.md)，了解如何获取磁盘空间使用情况。

## 💡 常见问题

### Q: 为什么空闲内存和实际可用内存不同？

A: 操作系统会使用部分内存作为缓存和缓冲区，这些内存在需要时可以释放给应用程序使用。`os.freemem()` 返回的是立即可用的内存。

### Q: 如何获取更详细的内存信息？

A: 可以通过读取系统特定的文件或调用系统 API：
- Linux: `/proc/meminfo`
- Windows: WMI 查询
- macOS: `vm_stat` 命令

### Q: 内存使用率多高算正常？

A: 这取决于具体应用场景：
- < 50%: 正常
- 50-70%: 适中
- 70-90%: 较高，需要关注
- > 90%: 可能影响性能

### Q: 如何处理内存泄漏检测？

A: 可以通过监控内存使用趋势来检测：
- 持续增长的内存使用
- 垃圾回收后内存不释放
- 异常的内存分配模式
