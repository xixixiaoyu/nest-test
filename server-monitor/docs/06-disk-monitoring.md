# 06 - 磁盘监控

本章将详细介绍如何实现磁盘空间监控功能，包括获取磁盘分区信息、计算使用率，以及处理跨平台兼容性问题。

## 🎯 学习目标

- 理解磁盘监控的基本概念
- 学会使用 node-disk-info 库获取磁盘信息
- 掌握磁盘使用率的计算和格式化
- 实现跨平台的磁盘监控功能
- 了解不同文件系统的特点

## 💿 磁盘监控基础

### 磁盘相关概念

1. **磁盘分区 (Partition)**: 磁盘的逻辑划分
2. **挂载点 (Mount Point)**: 分区在文件系统中的访问路径
3. **文件系统 (File System)**: 数据在磁盘上的组织方式
4. **块 (Block)**: 磁盘存储的基本单位

### 跨平台差异

| 操作系统 | 挂载点示例 | 文件系统类型 |
|---------|-----------|-------------|
| Windows | `C:\`, `D:\` | NTFS, FAT32 |
| Linux | `/`, `/home`, `/var` | ext4, xfs, btrfs |
| macOS | `/`, `/Volumes/Data` | APFS, HFS+ |

## 📦 node-disk-info 库详解

### 安装和基本用法

```bash
npm install node-disk-info
```

```typescript
import * as nodeDiskInfo from 'node-disk-info';

// 获取所有磁盘信息
const disks = await nodeDiskInfo.getDiskInfo();
console.log(disks);
```

### 返回数据结构

```typescript
interface DiskInfo {
  filesystem: string;    // 文件系统类型，如 'NTFS', 'ext4'
  blocks: number;        // 总块数（字节）
  used: number;          // 已使用块数（字节）
  available: number;     // 可用块数（字节）
  capacity: string;      // 使用率百分比，如 '45%'
  mounted: string;       // 挂载点，如 'C:\' 或 '/'
}
```

### 示例输出

```javascript
[
  {
    filesystem: '/dev/disk1s1',
    blocks: 250790436864,      // ~234 GB
    used: 180000000000,        // ~168 GB
    available: 70790436864,    // ~66 GB
    capacity: '72%',
    mounted: '/'
  },
  {
    filesystem: '/dev/disk1s4',
    blocks: 250790436864,
    used: 1073741824,          // ~1 GB
    available: 249716695040,   // ~233 GB
    capacity: '1%',
    mounted: '/private/var/vm'
  }
]
```

## 🔧 实现磁盘监控功能

### 基础实现

在 `src/utils/system-info.ts` 中添加磁盘监控函数：

```typescript
import * as nodeDiskInfo from 'node-disk-info';

/**
 * 将字节转换为 GB
 * @param bytes 字节数
 * @returns 格式化的 GB 字符串
 */
function bytesToGB(bytes: number): string {
  return (bytes / (1024 * 1024 * 1024)).toFixed(2);
}

/**
 * 获取磁盘信息
 * @returns 磁盘使用情况数组
 */
export async function getDiskInfo() {
  try {
    const disks = await nodeDiskInfo.getDiskInfo();
    return disks.map((disk) => ({
      mounted: disk.mounted, // 挂载点，如 / 或 C:\
      filesystem: disk.filesystem, // 文件系统类型
      total: `${bytesToGB(disk.blocks)} GB`, // 总空间
      used: `${bytesToGB(disk.used)} GB`, // 已用空间
      free: `${bytesToGB(disk.available)} GB`, // 剩余空间
      usage: disk.capacity, // 使用率，格式为 'xx%'
    }));
  } catch (error) {
    console.error('获取磁盘信息失败:', error);
    return [];
  }
}
```

### 详细解析

**1. 异步获取磁盘信息**
```typescript
const disks = await nodeDiskInfo.getDiskInfo();
```

**2. 数据格式化**
```typescript
return disks.map((disk) => ({
  mounted: disk.mounted,
  filesystem: disk.filesystem,
  total: `${bytesToGB(disk.blocks)} GB`,
  used: `${bytesToGB(disk.used)} GB`,
  free: `${bytesToGB(disk.available)} GB`,
  usage: disk.capacity,
}));
```

**3. 错误处理**
```typescript
try {
  // 磁盘信息获取逻辑
} catch (error) {
  console.error('获取磁盘信息失败:', error);
  return [];
}
```

## 🎨 扩展磁盘监控功能

### 1. 多单位支持

```typescript
/**
 * 存储单位枚举
 */
enum StorageUnit {
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
function convertStorageBytes(bytes: number, unit: StorageUnit): string {
  const units = {
    [StorageUnit.BYTES]: 1,
    [StorageUnit.KB]: 1024,
    [StorageUnit.MB]: 1024 * 1024,
    [StorageUnit.GB]: 1024 * 1024 * 1024,
    [StorageUnit.TB]: 1024 * 1024 * 1024 * 1024,
  };

  const value = bytes / units[unit];
  return `${value.toFixed(2)} ${unit}`;
}

/**
 * 获取详细磁盘信息
 * @param unit 显示单位
 * @returns 详细磁盘信息
 */
export async function getDetailedDiskInfo(unit: StorageUnit = StorageUnit.GB) {
  try {
    const disks = await nodeDiskInfo.getDiskInfo();
    return disks.map((disk) => ({
      mounted: disk.mounted,
      filesystem: disk.filesystem,
      total: {
        bytes: disk.blocks,
        formatted: convertStorageBytes(disk.blocks, unit)
      },
      used: {
        bytes: disk.used,
        formatted: convertStorageBytes(disk.used, unit)
      },
      available: {
        bytes: disk.available,
        formatted: convertStorageBytes(disk.available, unit)
      },
      usage: {
        percentage: disk.capacity,
        ratio: `${disk.used}/${disk.blocks}`
      }
    }));
  } catch (error) {
    console.error('获取详细磁盘信息失败:', error);
    return [];
  }
}
```

### 2. 磁盘状态评估

```typescript
/**
 * 磁盘状态枚举
 */
enum DiskStatus {
  HEALTHY = 'healthy',      // 健康
  WARNING = 'warning',      // 警告
  CRITICAL = 'critical',    // 严重
  FULL = 'full'            // 已满
}

/**
 * 评估磁盘状态
 * @param usagePercent 使用率百分比
 * @returns 磁盘状态信息
 */
function evaluateDiskStatus(usagePercent: number) {
  let status: DiskStatus;
  let message: string;
  let color: string;

  if (usagePercent < 70) {
    status = DiskStatus.HEALTHY;
    message = '磁盘空间充足';
    color = 'green';
  } else if (usagePercent < 85) {
    status = DiskStatus.WARNING;
    message = '磁盘空间不足，建议清理';
    color = 'yellow';
  } else if (usagePercent < 95) {
    status = DiskStatus.CRITICAL;
    message = '磁盘空间严重不足';
    color = 'orange';
  } else {
    status = DiskStatus.FULL;
    message = '磁盘空间几乎已满';
    color = 'red';
  }

  return { status, message, color };
}

/**
 * 获取磁盘状态信息
 * @returns 包含状态评估的磁盘信息
 */
export async function getDiskStatus() {
  try {
    const disks = await nodeDiskInfo.getDiskInfo();
    return disks.map((disk) => {
      const usagePercent = parseFloat(disk.capacity.replace('%', ''));
      const statusInfo = evaluateDiskStatus(usagePercent);
      
      return {
        mounted: disk.mounted,
        filesystem: disk.filesystem,
        total: `${bytesToGB(disk.blocks)} GB`,
        used: `${bytesToGB(disk.used)} GB`,
        available: `${bytesToGB(disk.available)} GB`,
        usage: disk.capacity,
        usagePercent,
        ...statusInfo
      };
    });
  } catch (error) {
    console.error('获取磁盘状态失败:', error);
    return [];
  }
}
```

### 3. 磁盘监控过滤

```typescript
/**
 * 磁盘过滤选项
 */
interface DiskFilterOptions {
  excludeSystem?: boolean;      // 排除系统分区
  minSize?: number;            // 最小大小（GB）
  includeTypes?: string[];     // 包含的文件系统类型
  excludeTypes?: string[];     // 排除的文件系统类型
  excludeMountPoints?: string[]; // 排除的挂载点
}

/**
 * 获取过滤后的磁盘信息
 * @param options 过滤选项
 * @returns 过滤后的磁盘信息
 */
export async function getFilteredDiskInfo(options: DiskFilterOptions = {}) {
  try {
    const disks = await nodeDiskInfo.getDiskInfo();
    
    return disks
      .filter((disk) => {
        // 按大小过滤
        if (options.minSize) {
          const sizeGB = disk.blocks / (1024 * 1024 * 1024);
          if (sizeGB < options.minSize) return false;
        }
        
        // 按文件系统类型过滤
        if (options.includeTypes && options.includeTypes.length > 0) {
          if (!options.includeTypes.some(type => 
            disk.filesystem.toLowerCase().includes(type.toLowerCase())
          )) return false;
        }
        
        if (options.excludeTypes && options.excludeTypes.length > 0) {
          if (options.excludeTypes.some(type => 
            disk.filesystem.toLowerCase().includes(type.toLowerCase())
          )) return false;
        }
        
        // 按挂载点过滤
        if (options.excludeMountPoints && options.excludeMountPoints.length > 0) {
          if (options.excludeMountPoints.includes(disk.mounted)) return false;
        }
        
        // 排除系统分区（简单实现）
        if (options.excludeSystem) {
          const systemMountPoints = ['/boot', '/sys', '/proc', '/dev'];
          if (systemMountPoints.some(point => disk.mounted.startsWith(point))) {
            return false;
          }
        }
        
        return true;
      })
      .map((disk) => ({
        mounted: disk.mounted,
        filesystem: disk.filesystem,
        total: `${bytesToGB(disk.blocks)} GB`,
        used: `${bytesToGB(disk.used)} GB`,
        available: `${bytesToGB(disk.available)} GB`,
        usage: disk.capacity,
      }));
  } catch (error) {
    console.error('获取过滤磁盘信息失败:', error);
    return [];
  }
}
```

### 4. 磁盘历史监控

```typescript
/**
 * 磁盘使用记录接口
 */
interface DiskUsageRecord {
  timestamp: number;
  mounted: string;
  total: number;
  used: number;
  available: number;
  usagePercent: number;
}

/**
 * 磁盘监控器类
 */
class DiskMonitor {
  private history: Map<string, DiskUsageRecord[]> = new Map();
  private maxHistorySize: number = 100;
  private monitorInterval: NodeJS.Timeout | null = null;

  /**
   * 开始监控
   * @param intervalMs 监控间隔（毫秒）
   */
  startMonitoring(intervalMs: number = 60000) { // 默认1分钟
    this.monitorInterval = setInterval(() => {
      this.recordDiskUsage();
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
   * 记录磁盘使用情况
   */
  private async recordDiskUsage() {
    try {
      const disks = await nodeDiskInfo.getDiskInfo();
      
      disks.forEach((disk) => {
        const record: DiskUsageRecord = {
          timestamp: Date.now(),
          mounted: disk.mounted,
          total: disk.blocks,
          used: disk.used,
          available: disk.available,
          usagePercent: parseFloat(disk.capacity.replace('%', ''))
        };

        if (!this.history.has(disk.mounted)) {
          this.history.set(disk.mounted, []);
        }

        const diskHistory = this.history.get(disk.mounted)!;
        diskHistory.push(record);

        // 保持历史记录大小
        if (diskHistory.length > this.maxHistorySize) {
          diskHistory.shift();
        }
      });
    } catch (error) {
      console.error('记录磁盘使用情况失败:', error);
    }
  }

  /**
   * 获取指定磁盘的历史记录
   * @param mountPoint 挂载点
   * @param count 获取记录数量
   * @returns 历史记录数组
   */
  getDiskHistory(mountPoint: string, count?: number): DiskUsageRecord[] {
    const diskHistory = this.history.get(mountPoint) || [];
    
    if (count) {
      return diskHistory.slice(-count);
    }
    return [...diskHistory];
  }

  /**
   * 获取所有磁盘的历史记录
   * @returns 所有磁盘的历史记录
   */
  getAllHistory(): Map<string, DiskUsageRecord[]> {
    const result = new Map();
    this.history.forEach((records, mountPoint) => {
      result.set(mountPoint, [...records]);
    });
    return result;
  }

  /**
   * 获取磁盘使用趋势
   * @param mountPoint 挂载点
   * @returns 趋势信息
   */
  getDiskTrend(mountPoint: string): { direction: 'up' | 'down' | 'stable', change: number } {
    const diskHistory = this.history.get(mountPoint) || [];
    
    if (diskHistory.length < 2) {
      return { direction: 'stable', change: 0 };
    }

    const recent = diskHistory.slice(-10); // 最近10次记录
    const firstUsage = recent[0].usagePercent;
    const lastUsage = recent[recent.length - 1].usagePercent;
    const change = lastUsage - firstUsage;

    let direction: 'up' | 'down' | 'stable';
    if (Math.abs(change) < 0.5) {
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

## 🧪 测试磁盘监控功能

### 创建测试文件

创建 `src/utils/disk-test.ts`：

```typescript
import { 
  getDiskInfo, 
  getDetailedDiskInfo, 
  getDiskStatus,
  getFilteredDiskInfo,
  StorageUnit 
} from './system-info';

async function testDiskMonitoring() {
  console.log('🔍 测试磁盘监控功能\n');

  // 基础磁盘信息
  console.log('💿 基础磁盘信息：');
  const basicDiskInfo = await getDiskInfo();
  basicDiskInfo.forEach((disk, index) => {
    console.log(`磁盘 ${index + 1}:`);
    console.log('  挂载点:', disk.mounted);
    console.log('  文件系统:', disk.filesystem);
    console.log('  总空间:', disk.total);
    console.log('  已用空间:', disk.used);
    console.log('  剩余空间:', disk.free);
    console.log('  使用率:', disk.usage);
    console.log('');
  });

  // 详细磁盘信息（MB 单位）
  console.log('📊 详细磁盘信息（MB 单位）：');
  const detailedDiskInfo = await getDetailedDiskInfo(StorageUnit.MB);
  detailedDiskInfo.forEach((disk, index) => {
    console.log(`磁盘 ${index + 1}:`);
    console.log('  挂载点:', disk.mounted);
    console.log('  总空间:', disk.total.formatted);
    console.log('  已用空间:', disk.used.formatted);
    console.log('  可用空间:', disk.available.formatted);
    console.log('  使用率:', disk.usage.percentage);
    console.log('');
  });

  // 磁盘状态评估
  console.log('🚦 磁盘状态评估：');
  const diskStatus = await getDiskStatus();
  diskStatus.forEach((disk, index) => {
    console.log(`磁盘 ${index + 1}:`);
    console.log('  挂载点:', disk.mounted);
    console.log('  状态:', disk.status);
    console.log('  消息:', disk.message);
    console.log('  使用率:', disk.usage);
    console.log('');
  });

  // 过滤磁盘信息
  console.log('🔍 过滤磁盘信息（排除小于1GB的分区）：');
  const filteredDiskInfo = await getFilteredDiskInfo({
    minSize: 1, // 最小1GB
    excludeSystem: true
  });
  console.log(`找到 ${filteredDiskInfo.length} 个符合条件的磁盘分区`);
  filteredDiskInfo.forEach((disk, index) => {
    console.log(`  ${index + 1}. ${disk.mounted} - ${disk.usage}`);
  });
}

// 运行测试
if (require.main === module) {
  testDiskMonitoring().catch(console.error);
}
```

### 运行测试

```bash
npx ts-node src/utils/disk-test.ts
```

## 🔍 跨平台兼容性处理

### 平台特定的磁盘信息

```typescript
/**
 * 获取平台特定的磁盘信息
 */
export async function getPlatformDiskInfo() {
  const platform = os.platform();
  const basicInfo = await getDiskInfo();
  
  let platformSpecific: any = {};
  
  switch (platform) {
    case 'linux':
      platformSpecific = await getLinuxDiskInfo();
      break;
    case 'darwin':
      platformSpecific = await getMacOSDiskInfo();
      break;
    case 'win32':
      platformSpecific = await getWindowsDiskInfo();
      break;
    default:
      platformSpecific = { note: '平台特定信息不可用' };
  }
  
  return {
    platform,
    disks: basicInfo,
    platformSpecific
  };
}

async function getLinuxDiskInfo() {
  // Linux 特定的磁盘信息
  return {
    note: 'Linux 系统磁盘信息',
    // 可以通过读取 /proc/mounts 获取更多信息
  };
}

async function getMacOSDiskInfo() {
  // macOS 特定的磁盘信息
  return {
    note: 'macOS 系统磁盘信息',
    // 可以通过 diskutil 命令获取更多信息
  };
}

async function getWindowsDiskInfo() {
  // Windows 特定的磁盘信息
  return {
    note: 'Windows 系统磁盘信息',
    // 可以通过 WMI 获取更多信息
  };
}
```

## 📈 性能优化

### 1. 磁盘信息缓存

```typescript
class DiskInfoCache {
  private cache: any = null;
  private lastUpdate: number = 0;
  private cacheTimeout: number = 30000; // 30秒缓存

  async getDiskInfo() {
    const now = Date.now();
    
    if (!this.cache || (now - this.lastUpdate) > this.cacheTimeout) {
      this.cache = await getDiskInfo();
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

### 2. 错误重试机制

```typescript
async function getDiskInfoWithRetry(maxRetries: number = 3): Promise<any[]> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await getDiskInfo();
    } catch (error) {
      console.warn(`获取磁盘信息失败，重试 ${i + 1}/${maxRetries}:`, error);
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  return [];
}
```

## 🎉 小结

在这一章中，我们学习了：

1. **磁盘监控基础**：理解磁盘分区、挂载点、文件系统等概念
2. **node-disk-info 库**：使用第三方库获取跨平台磁盘信息
3. **功能实现**：基础磁盘信息获取和格式化
4. **功能扩展**：多单位支持、状态评估、过滤、历史监控
5. **跨平台兼容**：处理不同操作系统的差异
6. **性能优化**：缓存机制和错误处理

## 🔗 下一步

现在您已经掌握了磁盘监控的实现，接下来我们将学习 [系统信息获取](./07-system-info.md)，了解如何获取主机名、IP 地址、操作系统等基本信息。

## 💡 常见问题

### Q: 为什么有些磁盘分区显示不出来？

A: 可能的原因：
- 权限不足：某些系统分区需要管理员权限
- 虚拟文件系统：如 `/proc`, `/sys` 等不是真实磁盘
- 网络驱动器：某些网络挂载的驱动器可能不显示

### Q: 如何区分系统分区和用户分区？

A: 可以通过挂载点和文件系统类型来判断：
- 系统分区通常挂载在 `/boot`, `/sys`, `/proc` 等
- 用户分区通常挂载在 `/home`, `/var`, `C:\`, `D:\` 等

### Q: 磁盘使用率计算是否准确？

A: node-disk-info 库提供的数据通常是准确的，但需要注意：
- 文件系统预留空间：某些文件系统会预留一部分空间
- 硬链接和符号链接：可能影响实际使用量的计算
- 临时文件：系统临时文件可能导致使用量波动

### Q: 如何监控网络驱动器？

A: 网络驱动器的监控取决于操作系统和挂载方式：
- Windows：映射的网络驱动器通常可以正常监控
- Linux/macOS：NFS、SMB 等网络文件系统需要特殊处理
