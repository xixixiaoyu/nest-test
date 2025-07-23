# 08 - 动态监控

本章将详细介绍如何实现动态监控功能，包括实时数据采集、历史数据管理、趋势分析和告警机制，为服务器监控系统提供持续的状态跟踪能力。

## 🎯 学习目标

- 理解动态监控的核心概念和重要性
- 学会实现定时数据采集机制
- 掌握历史数据的存储和管理
- 实现趋势分析和异常检测
- 构建灵活的告警系统

## ⚡ 动态监控基础

### 静态 vs 动态监控

| 监控类型 | 特点 | 适用场景 | 优缺点 |
|---------|------|---------|--------|
| 静态监控 | 单次数据获取 | 系统信息查询 | 简单快速，但无法反映变化趋势 |
| 动态监控 | 持续数据采集 | 性能监控、告警 | 数据丰富，但消耗更多资源 |

### 动态监控的核心组件

1. **数据采集器 (Data Collector)**: 定时获取系统指标
2. **数据存储器 (Data Storage)**: 管理历史数据
3. **趋势分析器 (Trend Analyzer)**: 分析数据变化趋势
4. **告警管理器 (Alert Manager)**: 检测异常并发送告警

## 🔧 实现动态监控框架

### 1. 监控数据接口定义

```typescript
/**
 * 监控数据点接口
 */
interface MonitoringDataPoint {
  timestamp: number;
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: Array<{
    mounted: string;
    total: number;
    used: number;
    usage: number;
  }>;
  system: {
    uptime: number;
    loadAverage: number[];
  };
}

/**
 * 监控配置接口
 */
interface MonitoringConfig {
  interval: number;           // 采集间隔（毫秒）
  historySize: number;        // 历史数据保留数量
  enableAlerts: boolean;      // 是否启用告警
  thresholds: {              // 告警阈值
    cpu: number;
    memory: number;
    disk: number;
  };
}
```

### 2. 核心监控类实现

```typescript
import { EventEmitter } from 'events';
import { getCpuInfo, getMemInfo, getDiskInfo, getSysInfo } from './system-info';

/**
 * 动态监控器类
 */
export class DynamicMonitor extends EventEmitter {
  private config: MonitoringConfig;
  private history: MonitoringDataPoint[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(config: Partial<MonitoringConfig> = {}) {
    super();
    
    // 默认配置
    this.config = {
      interval: 5000,           // 5秒采集一次
      historySize: 1000,        // 保留1000个数据点
      enableAlerts: true,       // 启用告警
      thresholds: {
        cpu: 80,                // CPU 使用率阈值 80%
        memory: 85,             // 内存使用率阈值 85%
        disk: 90,               // 磁盘使用率阈值 90%
      },
      ...config,
    };
  }

  /**
   * 开始监控
   */
  start(): void {
    if (this.isRunning) {
      console.warn('监控已在运行中');
      return;
    }

    this.isRunning = true;
    this.emit('start');
    
    // 立即采集一次数据
    this.collectData();
    
    // 设置定时采集
    this.intervalId = setInterval(() => {
      this.collectData();
    }, this.config.interval);

    console.log(`动态监控已启动，采集间隔: ${this.config.interval}ms`);
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('监控未在运行');
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.emit('stop');
    console.log('动态监控已停止');
  }

  /**
   * 采集数据
   */
  private async collectData(): Promise<void> {
    try {
      const timestamp = Date.now();
      
      // 并行获取所有监控数据
      const [cpuInfo, memInfo, diskInfo, sysInfo] = await Promise.all([
        this.getCpuUsage(),
        Promise.resolve(getMemInfo()),
        getDiskInfo(),
        Promise.resolve(getSysInfo()),
      ]);

      // 构建数据点
      const dataPoint: MonitoringDataPoint = {
        timestamp,
        cpu: {
          usage: parseFloat(cpuInfo.used.replace('%', '')),
          cores: cpuInfo.cpuNum,
        },
        memory: {
          total: this.parseSize(memInfo.total),
          used: this.parseSize(memInfo.used),
          free: this.parseSize(memInfo.free),
          usage: parseFloat(memInfo.usage.replace('%', '')),
        },
        disk: diskInfo.map(disk => ({
          mounted: disk.mounted,
          total: this.parseSize(disk.total),
          used: this.parseSize(disk.used),
          usage: parseFloat(disk.usage.replace('%', '')),
        })),
        system: {
          uptime: os.uptime(),
          loadAverage: os.loadavg(),
        },
      };

      // 添加到历史数据
      this.addDataPoint(dataPoint);
      
      // 检查告警
      if (this.config.enableAlerts) {
        this.checkAlerts(dataPoint);
      }

      // 发出数据更新事件
      this.emit('data', dataPoint);

    } catch (error) {
      console.error('数据采集失败:', error);
      this.emit('error', error);
    }
  }

  /**
   * 获取 CPU 使用率（动态采样）
   */
  private async getCpuUsage(): Promise<any> {
    // 这里可以使用之前实现的 getDynamicCpuUsage 函数
    // 或者使用简化版本以提高性能
    return getCpuInfo();
  }

  /**
   * 解析大小字符串为字节数
   */
  private parseSize(sizeStr: string): number {
    const match = sizeStr.match(/^([\d.]+)\s*(\w+)$/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    const multipliers: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024,
    };

    return value * (multipliers[unit] || 1);
  }

  /**
   * 添加数据点到历史记录
   */
  private addDataPoint(dataPoint: MonitoringDataPoint): void {
    this.history.push(dataPoint);

    // 保持历史数据大小限制
    if (this.history.length > this.config.historySize) {
      this.history.shift();
    }
  }

  /**
   * 检查告警条件
   */
  private checkAlerts(dataPoint: MonitoringDataPoint): void {
    const alerts: string[] = [];

    // CPU 告警检查
    if (dataPoint.cpu.usage > this.config.thresholds.cpu) {
      alerts.push(`CPU 使用率过高: ${dataPoint.cpu.usage.toFixed(2)}%`);
    }

    // 内存告警检查
    if (dataPoint.memory.usage > this.config.thresholds.memory) {
      alerts.push(`内存使用率过高: ${dataPoint.memory.usage.toFixed(2)}%`);
    }

    // 磁盘告警检查
    dataPoint.disk.forEach(disk => {
      if (disk.usage > this.config.thresholds.disk) {
        alerts.push(`磁盘 ${disk.mounted} 使用率过高: ${disk.usage.toFixed(2)}%`);
      }
    });

    // 发送告警
    if (alerts.length > 0) {
      this.emit('alert', {
        timestamp: dataPoint.timestamp,
        alerts,
        dataPoint,
      });
    }
  }

  /**
   * 获取历史数据
   */
  getHistory(count?: number): MonitoringDataPoint[] {
    if (count) {
      return this.history.slice(-count);
    }
    return [...this.history];
  }

  /**
   * 获取最新数据
   */
  getLatest(): MonitoringDataPoint | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  /**
   * 获取运行状态
   */
  getStatus(): { isRunning: boolean; dataPoints: number; uptime: number } {
    return {
      isRunning: this.isRunning,
      dataPoints: this.history.length,
      uptime: this.isRunning ? Date.now() - (this.history[0]?.timestamp || Date.now()) : 0,
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      this.stop();
    }

    this.config = { ...this.config, ...newConfig };

    if (wasRunning) {
      this.start();
    }

    this.emit('configUpdated', this.config);
  }

  /**
   * 清空历史数据
   */
  clearHistory(): void {
    this.history = [];
    this.emit('historyCleared');
  }
}
```

### 3. 趋势分析功能

```typescript
/**
 * 趋势分析器类
 */
export class TrendAnalyzer {
  /**
   * 计算平均值
   */
  static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /**
   * 计算趋势方向
   */
  static calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = this.calculateAverage(firstHalf);
    const secondAvg = this.calculateAverage(secondHalf);

    const difference = secondAvg - firstAvg;
    const threshold = firstAvg * 0.05; // 5% 变化阈值

    if (Math.abs(difference) < threshold) {
      return 'stable';
    }

    return difference > 0 ? 'up' : 'down';
  }

  /**
   * 分析监控数据趋势
   */
  static analyzeMonitoringTrend(history: MonitoringDataPoint[], minutes: number = 10) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recentData = history.filter(point => point.timestamp > cutoff);

    if (recentData.length === 0) {
      return {
        cpu: { trend: 'stable' as const, average: 0 },
        memory: { trend: 'stable' as const, average: 0 },
        disk: { trend: 'stable' as const, average: 0 },
      };
    }

    const cpuValues = recentData.map(point => point.cpu.usage);
    const memoryValues = recentData.map(point => point.memory.usage);
    const diskValues = recentData.map(point => 
      Math.max(...point.disk.map(d => d.usage))
    );

    return {
      cpu: {
        trend: this.calculateTrend(cpuValues),
        average: this.calculateAverage(cpuValues),
        current: cpuValues[cpuValues.length - 1] || 0,
      },
      memory: {
        trend: this.calculateTrend(memoryValues),
        average: this.calculateAverage(memoryValues),
        current: memoryValues[memoryValues.length - 1] || 0,
      },
      disk: {
        trend: this.calculateTrend(diskValues),
        average: this.calculateAverage(diskValues),
        current: diskValues[diskValues.length - 1] || 0,
      },
    };
  }

  /**
   * 预测未来趋势
   */
  static predictTrend(values: number[], periods: number = 5): number[] {
    if (values.length < 3) return [];

    // 简单线性回归预测
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // 预测未来值
    const predictions: number[] = [];
    for (let i = 1; i <= periods; i++) {
      const predictedValue = slope * (n + i - 1) + intercept;
      predictions.push(Math.max(0, Math.min(100, predictedValue))); // 限制在 0-100% 范围内
    }

    return predictions;
  }
}
```

### 4. 告警管理器

```typescript
/**
 * 告警级别枚举
 */
enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * 告警接口
 */
interface Alert {
  id: string;
  level: AlertLevel;
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  data?: any;
}

/**
 * 告警管理器类
 */
export class AlertManager extends EventEmitter {
  private alerts: Map<string, Alert> = new Map();
  private rules: AlertRule[] = [];

  /**
   * 添加告警规则
   */
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  /**
   * 检查告警条件
   */
  checkAlerts(dataPoint: MonitoringDataPoint): void {
    this.rules.forEach(rule => {
      const shouldAlert = rule.condition(dataPoint);
      const alertId = rule.id;

      if (shouldAlert) {
        if (!this.alerts.has(alertId) || this.alerts.get(alertId)?.resolved) {
          // 创建新告警
          const alert: Alert = {
            id: alertId,
            level: rule.level,
            message: rule.message(dataPoint),
            timestamp: Date.now(),
            resolved: false,
            data: dataPoint,
          };

          this.alerts.set(alertId, alert);
          this.emit('alert', alert);
        }
      } else {
        // 解决告警
        const existingAlert = this.alerts.get(alertId);
        if (existingAlert && !existingAlert.resolved) {
          existingAlert.resolved = true;
          existingAlert.resolvedAt = Date.now();
          this.emit('alertResolved', existingAlert);
        }
      }
    });
  }

  /**
   * 获取活跃告警
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * 获取所有告警
   */
  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * 清空告警历史
   */
  clearAlerts(): void {
    this.alerts.clear();
    this.emit('alertsCleared');
  }
}

/**
 * 告警规则接口
 */
interface AlertRule {
  id: string;
  level: AlertLevel;
  condition: (dataPoint: MonitoringDataPoint) => boolean;
  message: (dataPoint: MonitoringDataPoint) => string;
}

/**
 * 预定义告警规则
 */
export const defaultAlertRules: AlertRule[] = [
  {
    id: 'high-cpu',
    level: AlertLevel.WARNING,
    condition: (data) => data.cpu.usage > 80,
    message: (data) => `CPU 使用率过高: ${data.cpu.usage.toFixed(2)}%`,
  },
  {
    id: 'critical-cpu',
    level: AlertLevel.CRITICAL,
    condition: (data) => data.cpu.usage > 95,
    message: (data) => `CPU 使用率严重过高: ${data.cpu.usage.toFixed(2)}%`,
  },
  {
    id: 'high-memory',
    level: AlertLevel.WARNING,
    condition: (data) => data.memory.usage > 85,
    message: (data) => `内存使用率过高: ${data.memory.usage.toFixed(2)}%`,
  },
  {
    id: 'critical-memory',
    level: AlertLevel.CRITICAL,
    condition: (data) => data.memory.usage > 95,
    message: (data) => `内存使用率严重过高: ${data.memory.usage.toFixed(2)}%`,
  },
  {
    id: 'high-disk',
    level: AlertLevel.WARNING,
    condition: (data) => data.disk.some(disk => disk.usage > 90),
    message: (data) => {
      const highDisk = data.disk.find(disk => disk.usage > 90);
      return `磁盘 ${highDisk?.mounted} 使用率过高: ${highDisk?.usage.toFixed(2)}%`;
    },
  },
];
```

## 🧪 测试动态监控功能

### 创建测试文件

创建 `src/utils/dynamic-monitor-test.ts`：

```typescript
import { DynamicMonitor, TrendAnalyzer, AlertManager, defaultAlertRules } from './dynamic-monitoring';

async function testDynamicMonitoring() {
  console.log('🔍 测试动态监控功能\n');

  // 创建监控实例
  const monitor = new DynamicMonitor({
    interval: 2000,        // 2秒采集一次
    historySize: 50,       // 保留50个数据点
    enableAlerts: true,
    thresholds: {
      cpu: 70,             // 降低阈值便于测试
      memory: 75,
      disk: 80,
    },
  });

  // 创建告警管理器
  const alertManager = new AlertManager();
  defaultAlertRules.forEach(rule => alertManager.addRule(rule));

  // 监听事件
  monitor.on('start', () => {
    console.log('✅ 监控已启动');
  });

  monitor.on('data', (dataPoint) => {
    console.log(`📊 [${new Date(dataPoint.timestamp).toLocaleTimeString()}] CPU: ${dataPoint.cpu.usage.toFixed(1)}%, 内存: ${dataPoint.memory.usage.toFixed(1)}%`);
    
    // 检查告警
    alertManager.checkAlerts(dataPoint);
  });

  monitor.on('alert', (alert) => {
    console.log(`🚨 告警: ${alert.alerts.join(', ')}`);
  });

  monitor.on('stop', () => {
    console.log('⏹️ 监控已停止');
  });

  // 监听告警管理器事件
  alertManager.on('alert', (alert) => {
    console.log(`🔔 新告警 [${alert.level.toUpperCase()}]: ${alert.message}`);
  });

  alertManager.on('alertResolved', (alert) => {
    console.log(`✅ 告警已解决: ${alert.message}`);
  });

  // 启动监控
  monitor.start();

  // 运行10秒后分析趋势
  setTimeout(() => {
    console.log('\n📈 趋势分析:');
    const history = monitor.getHistory();
    const trend = TrendAnalyzer.analyzeMonitoringTrend(history, 1); // 分析最近1分钟

    console.log(`CPU 趋势: ${trend.cpu.trend}, 平均: ${trend.cpu.average.toFixed(2)}%`);
    console.log(`内存趋势: ${trend.memory.trend}, 平均: ${trend.memory.average.toFixed(2)}%`);
    console.log(`磁盘趋势: ${trend.disk.trend}, 平均: ${trend.disk.average.toFixed(2)}%`);

    // 预测未来趋势
    const cpuValues = history.map(point => point.cpu.usage);
    const predictions = TrendAnalyzer.predictTrend(cpuValues, 3);
    console.log(`CPU 预测值: ${predictions.map(v => v.toFixed(1)).join('%, ')}%`);
  }, 10000);

  // 运行15秒后显示告警状态
  setTimeout(() => {
    console.log('\n🚨 告警状态:');
    const activeAlerts = alertManager.getActiveAlerts();
    console.log(`活跃告警数量: ${activeAlerts.length}`);
    
    activeAlerts.forEach(alert => {
      console.log(`- [${alert.level.toUpperCase()}] ${alert.message}`);
    });
  }, 15000);

  // 运行20秒后停止监控
  setTimeout(() => {
    console.log('\n📊 监控统计:');
    const status = monitor.getStatus();
    console.log(`数据点数量: ${status.dataPoints}`);
    console.log(`运行时间: ${(status.uptime / 1000).toFixed(1)} 秒`);
    
    monitor.stop();
    
    // 显示最终统计
    setTimeout(() => {
      const allAlerts = alertManager.getAllAlerts();
      console.log(`\n📋 总告警数量: ${allAlerts.length}`);
      console.log('测试完成');
      process.exit(0);
    }, 1000);
  }, 20000);
}

// 运行测试
if (require.main === module) {
  testDynamicMonitoring().catch(console.error);
}
```

### 运行测试

```bash
npx ts-node src/utils/dynamic-monitor-test.ts
```

## 📈 性能优化

### 1. 数据采集优化

```typescript
/**
 * 优化的数据采集器
 */
class OptimizedDataCollector {
  private cpuSampler: CpuSampler;
  private lastCollectionTime: number = 0;

  constructor() {
    this.cpuSampler = new CpuSampler();
  }

  async collectOptimized(): Promise<MonitoringDataPoint> {
    const now = Date.now();
    const timeSinceLastCollection = now - this.lastCollectionTime;

    // 根据时间间隔调整采集策略
    const useDetailedCpu = timeSinceLastCollection > 5000; // 5秒以上使用详细采集

    const [cpuInfo, memInfo, diskInfo] = await Promise.all([
      useDetailedCpu ? this.cpuSampler.getDetailedUsage() : this.cpuSampler.getQuickUsage(),
      this.getMemInfoCached(),
      this.getDiskInfoCached(),
    ]);

    this.lastCollectionTime = now;

    return {
      timestamp: now,
      cpu: cpuInfo,
      memory: memInfo,
      disk: diskInfo,
      system: {
        uptime: os.uptime(),
        loadAverage: os.loadavg(),
      },
    };
  }

  private memInfoCache: { data: any; timestamp: number } | null = null;
  private diskInfoCache: { data: any; timestamp: number } | null = null;

  private async getMemInfoCached() {
    const now = Date.now();
    if (!this.memInfoCache || (now - this.memInfoCache.timestamp) > 1000) {
      this.memInfoCache = {
        data: getMemInfo(),
        timestamp: now,
      };
    }
    return this.memInfoCache.data;
  }

  private async getDiskInfoCached() {
    const now = Date.now();
    if (!this.diskInfoCache || (now - this.diskInfoCache.timestamp) > 30000) {
      this.diskInfoCache = {
        data: await getDiskInfo(),
        timestamp: now,
      };
    }
    return this.diskInfoCache.data;
  }
}
```

### 2. 内存管理

```typescript
/**
 * 内存优化的历史数据管理
 */
class OptimizedHistoryManager {
  private shortTermHistory: MonitoringDataPoint[] = [];
  private longTermHistory: MonitoringDataPoint[] = [];
  private compressionRatio: number = 10; // 长期存储压缩比例

  addDataPoint(dataPoint: MonitoringDataPoint): void {
    this.shortTermHistory.push(dataPoint);

    // 保持短期历史大小
    if (this.shortTermHistory.length > 100) {
      // 将旧数据压缩到长期存储
      const oldData = this.shortTermHistory.shift()!;
      if (this.shouldCompress(oldData)) {
        this.longTermHistory.push(this.compressDataPoint(oldData));
      }
    }

    // 保持长期历史大小
    if (this.longTermHistory.length > 1000) {
      this.longTermHistory.shift();
    }
  }

  private shouldCompress(dataPoint: MonitoringDataPoint): boolean {
    return this.longTermHistory.length % this.compressionRatio === 0;
  }

  private compressDataPoint(dataPoint: MonitoringDataPoint): MonitoringDataPoint {
    // 简化数据结构，只保留关键信息
    return {
      timestamp: dataPoint.timestamp,
      cpu: {
        usage: Math.round(dataPoint.cpu.usage),
        cores: dataPoint.cpu.cores,
      },
      memory: {
        ...dataPoint.memory,
        usage: Math.round(dataPoint.memory.usage),
      },
      disk: dataPoint.disk.map(disk => ({
        mounted: disk.mounted,
        total: disk.total,
        used: disk.used,
        usage: Math.round(disk.usage),
      })),
      system: dataPoint.system,
    };
  }

  getRecentHistory(minutes: number): MonitoringDataPoint[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.shortTermHistory.filter(point => point.timestamp > cutoff);
  }

  getAllHistory(): MonitoringDataPoint[] {
    return [...this.longTermHistory, ...this.shortTermHistory];
  }
}
```

## 🎉 小结

在这一章中，我们学习了：

1. **动态监控框架**：构建完整的实时监控系统
2. **数据采集机制**：定时获取和处理系统指标
3. **历史数据管理**：高效存储和检索历史数据
4. **趋势分析**：分析数据变化趋势和预测
5. **告警系统**：智能检测异常并发送告警
6. **性能优化**：缓存、压缩等优化技术

## 🔗 下一步

现在您已经掌握了动态监控的实现，接下来我们将学习 [控制器设计](./09-controller-design.md)，了解如何将监控功能集成到 NestJS API 中。

## 💡 常见问题

### Q: 监控频率应该设置多高？

A: 监控频率的选择需要平衡实时性和性能：
- **高频监控** (1-5秒): 适用于关键系统，但消耗更多资源
- **中频监控** (10-30秒): 适用于一般应用，平衡性能和实时性
- **低频监控** (1-5分钟): 适用于长期趋势分析

### Q: 如何处理监控数据的存储？

A: 可以采用分层存储策略：
- **内存存储**: 最近的数据，快速访问
- **本地文件**: 中期数据，定期持久化
- **数据库**: 长期数据，支持复杂查询
- **时序数据库**: 专门的时序数据存储

### Q: 告警风暴如何处理？

A: 可以采用以下策略：
- **告警抑制**: 相同类型告警在短时间内只发送一次
- **告警聚合**: 将相关告警合并为一个
- **告警升级**: 根据严重程度和持续时间升级告警
- **静默期**: 设置告警静默时间窗口

### Q: 如何确保监控系统的可靠性？

A: 监控系统本身也需要监控：
- **健康检查**: 定期检查监控组件状态
- **故障转移**: 主备监控系统切换
- **数据备份**: 定期备份监控数据
- **性能监控**: 监控监控系统的性能指标
