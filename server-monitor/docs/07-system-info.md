# 07 - 系统信息获取

本章将详细介绍如何获取系统基本信息，包括主机名、IP 地址、操作系统类型、架构等关键信息，为服务器监控提供完整的系统环境描述。

## 🎯 学习目标

- 理解系统信息的重要性和用途
- 学会使用 Node.js os 模块获取系统信息
- 掌握网络接口信息的获取和处理
- 实现跨平台的系统信息收集
- 了解系统信息的安全性考虑

## 🖥️ 系统信息基础

### 系统信息的重要性

系统信息在服务器监控中的作用：

1. **环境识别**: 确定服务器的运行环境
2. **问题诊断**: 帮助定位平台相关的问题
3. **资源规划**: 了解硬件配置进行容量规划
4. **安全审计**: 记录系统访问和操作日志
5. **自动化部署**: 根据系统信息进行自动化配置

### 主要系统信息类型

| 信息类型 | 描述 | 示例 |
|---------|------|------|
| 主机名 | 计算机在网络中的标识 | `web-server-01` |
| IP 地址 | 网络接口的 IP 地址 | `192.168.1.100` |
| 操作系统 | 系统平台类型 | `linux`, `win32`, `darwin` |
| 架构 | CPU 架构类型 | `x64`, `arm64` |
| 系统版本 | 操作系统版本信息 | `Ubuntu 20.04` |
| 运行时间 | 系统启动后的运行时间 | `7 days, 3 hours` |

## 📊 Node.js 系统信息 API

### os 模块核心方法

```typescript
import * as os from 'os';

// 基本系统信息
console.log('主机名:', os.hostname());        // 主机名
console.log('平台:', os.platform());          // 操作系统平台
console.log('架构:', os.arch());              // CPU 架构
console.log('版本:', os.release());           // 系统版本
console.log('类型:', os.type());              // 系统类型
console.log('运行时间:', os.uptime());         // 系统运行时间（秒）
console.log('用户信息:', os.userInfo());       // 当前用户信息
console.log('临时目录:', os.tmpdir());         // 临时目录路径
console.log('主目录:', os.homedir());          // 用户主目录
```

### 网络接口信息

```typescript
// 获取网络接口信息
const networkInterfaces = os.networkInterfaces();
console.log('网络接口:', networkInterfaces);
```

**网络接口数据结构：**
```typescript
interface NetworkInterface {
  address: string;      // IP 地址
  netmask: string;      // 子网掩码
  family: 'IPv4' | 'IPv6'; // IP 协议版本
  mac: string;          // MAC 地址
  internal: boolean;    // 是否为内部接口（如回环接口）
  cidr: string | null;  // CIDR 表示法
  scopeid?: number;     // IPv6 作用域 ID
}
```

## 🔧 实现系统信息获取功能

### 基础实现

在 `src/utils/system-info.ts` 中添加系统信息函数：

```typescript
import * as os from 'os';

/**
 * 获取系统基本信息
 * @returns 系统信息对象
 */
export function getSysInfo() {
  function getServerIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const networkInterface = interfaces[name];
      if (networkInterface) {
        for (const net of networkInterface) {
          // 过滤非 IPv4 和本地回环地址
          if (net.family === 'IPv4' && !net.internal) {
            return net.address;
          }
        }
      }
    }
    return '127.0.0.1'; // 默认返回本地地址
  }

  return {
    computerName: os.hostname(), // 主机名
    computerIp: getServerIP(), // 主 IP 地址
    osName: os.platform(), // 操作系统，如 linux、win32
    osArch: os.arch(), // 架构，如 x64、arm64
  };
}
```

### 详细解析

**1. 获取主机名**
```typescript
const hostname = os.hostname();
```

**2. 获取主要 IP 地址**
```typescript
function getServerIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const networkInterface = interfaces[name];
    if (networkInterface) {
      for (const net of networkInterface) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }
  return '127.0.0.1';
}
```

**3. 获取操作系统信息**
```typescript
const platform = os.platform(); // 'linux', 'win32', 'darwin'
const arch = os.arch();         // 'x64', 'arm64', 'ia32'
```

## 🎨 扩展系统信息功能

### 1. 详细系统信息

```typescript
/**
 * 获取详细系统信息
 * @returns 详细系统信息对象
 */
export function getDetailedSysInfo() {
  const basicInfo = getSysInfo();
  
  // 格式化运行时间
  function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days} 天`);
    if (hours > 0) parts.push(`${hours} 小时`);
    if (minutes > 0) parts.push(`${minutes} 分钟`);
    
    return parts.length > 0 ? parts.join(' ') : '不到 1 分钟';
  }

  // 获取系统版本描述
  function getOSDescription(): string {
    const platform = os.platform();
    const release = os.release();
    const type = os.type();
    
    switch (platform) {
      case 'linux':
        return `Linux ${release}`;
      case 'win32':
        return `Windows ${release}`;
      case 'darwin':
        return `macOS ${release}`;
      default:
        return `${type} ${release}`;
    }
  }

  return {
    ...basicInfo,
    osVersion: os.release(),                    // 系统版本
    osType: os.type(),                         // 系统类型
    osDescription: getOSDescription(),          // 系统描述
    uptime: formatUptime(os.uptime()),         // 格式化的运行时间
    uptimeSeconds: os.uptime(),                // 运行时间（秒）
    userInfo: os.userInfo(),                   // 用户信息
    homeDirectory: os.homedir(),               // 用户主目录
    tempDirectory: os.tmpdir(),                // 临时目录
    endianness: os.endianness(),               // 字节序
    loadAverage: os.loadavg(),                 // 负载平均值（仅 Unix）
  };
}
```

### 2. 网络接口详细信息

```typescript
/**
 * 网络接口信息接口
 */
interface NetworkInterfaceInfo {
  name: string;
  addresses: {
    ipv4: string[];
    ipv6: string[];
  };
  mac: string;
  isUp: boolean;
  isLoopback: boolean;
}

/**
 * 获取网络接口详细信息
 * @returns 网络接口信息数组
 */
export function getNetworkInterfaces(): NetworkInterfaceInfo[] {
  const interfaces = os.networkInterfaces();
  const result: NetworkInterfaceInfo[] = [];

  for (const [name, addresses] of Object.entries(interfaces)) {
    if (!addresses) continue;

    const ipv4Addresses: string[] = [];
    const ipv6Addresses: string[] = [];
    let mac = '';
    let isLoopback = false;

    for (const addr of addresses) {
      if (addr.family === 'IPv4') {
        ipv4Addresses.push(addr.address);
        if (addr.internal) isLoopback = true;
      } else if (addr.family === 'IPv6') {
        ipv6Addresses.push(addr.address);
      }
      
      if (!mac && addr.mac && addr.mac !== '00:00:00:00:00:00') {
        mac = addr.mac;
      }
    }

    result.push({
      name,
      addresses: {
        ipv4: ipv4Addresses,
        ipv6: ipv6Addresses,
      },
      mac,
      isUp: ipv4Addresses.length > 0 || ipv6Addresses.length > 0,
      isLoopback,
    });
  }

  return result;
}

/**
 * 获取主要网络接口信息
 * @returns 主要网络接口信息
 */
export function getPrimaryNetworkInterface(): NetworkInterfaceInfo | null {
  const interfaces = getNetworkInterfaces();
  
  // 查找非回环接口且有 IPv4 地址的接口
  const primaryInterface = interfaces.find(
    iface => !iface.isLoopback && iface.addresses.ipv4.length > 0
  );
  
  return primaryInterface || null;
}
```

### 3. 系统性能概览

```typescript
/**
 * 系统性能概览接口
 */
interface SystemOverview {
  system: ReturnType<typeof getDetailedSysInfo>;
  cpu: {
    model: string;
    cores: number;
    speed: number;
  };
  memory: {
    total: string;
    free: string;
    usage: string;
  };
  network: NetworkInterfaceInfo[];
  timestamp: string;
}

/**
 * 获取系统性能概览
 * @returns 系统性能概览
 */
export function getSystemOverview(): SystemOverview {
  const cpus = os.cpus();
  const firstCpu = cpus[0];
  
  // 获取内存信息（假设已实现 getMemInfo 函数）
  const memInfo = getMemInfo();
  
  return {
    system: getDetailedSysInfo(),
    cpu: {
      model: firstCpu.model,
      cores: cpus.length,
      speed: firstCpu.speed,
    },
    memory: memInfo,
    network: getNetworkInterfaces(),
    timestamp: new Date().toISOString(),
  };
}
```

### 4. 系统环境变量

```typescript
/**
 * 获取重要的环境变量
 * @returns 环境变量对象
 */
export function getEnvironmentInfo() {
  const env = process.env;
  
  // 定义重要的环境变量
  const importantVars = [
    'NODE_ENV',
    'PATH',
    'HOME',
    'USER',
    'SHELL',
    'LANG',
    'TZ',
    'PORT',
  ];
  
  const environmentVars: Record<string, string | undefined> = {};
  
  importantVars.forEach(varName => {
    environmentVars[varName] = env[varName];
  });
  
  return {
    nodeVersion: process.version,           // Node.js 版本
    platform: process.platform,            // 平台
    arch: process.arch,                     // 架构
    pid: process.pid,                       // 进程 ID
    ppid: process.ppid,                     // 父进程 ID
    execPath: process.execPath,             // Node.js 可执行文件路径
    argv: process.argv,                     // 命令行参数
    cwd: process.cwd(),                     // 当前工作目录
    environmentVars,                        // 重要环境变量
  };
}
```

## 🧪 测试系统信息功能

### 创建测试文件

创建 `src/utils/system-test.ts`：

```typescript
import { 
  getSysInfo, 
  getDetailedSysInfo,
  getNetworkInterfaces,
  getPrimaryNetworkInterface,
  getSystemOverview,
  getEnvironmentInfo
} from './system-info';

async function testSystemInfo() {
  console.log('🔍 测试系统信息功能\n');

  // 基础系统信息
  console.log('🖥️ 基础系统信息：');
  const basicSysInfo = getSysInfo();
  console.log('主机名:', basicSysInfo.computerName);
  console.log('IP 地址:', basicSysInfo.computerIp);
  console.log('操作系统:', basicSysInfo.osName);
  console.log('架构:', basicSysInfo.osArch);
  console.log('');

  // 详细系统信息
  console.log('📊 详细系统信息：');
  const detailedSysInfo = getDetailedSysInfo();
  console.log('系统描述:', detailedSysInfo.osDescription);
  console.log('运行时间:', detailedSysInfo.uptime);
  console.log('用户:', detailedSysInfo.userInfo.username);
  console.log('主目录:', detailedSysInfo.homeDirectory);
  console.log('字节序:', detailedSysInfo.endianness);
  console.log('');

  // 网络接口信息
  console.log('🌐 网络接口信息：');
  const networkInterfaces = getNetworkInterfaces();
  networkInterfaces.forEach((iface, index) => {
    console.log(`接口 ${index + 1}: ${iface.name}`);
    console.log('  IPv4 地址:', iface.addresses.ipv4.join(', ') || '无');
    console.log('  IPv6 地址:', iface.addresses.ipv6.slice(0, 2).join(', ') || '无');
    console.log('  MAC 地址:', iface.mac || '未知');
    console.log('  状态:', iface.isUp ? '启用' : '禁用');
    console.log('  类型:', iface.isLoopback ? '回环接口' : '物理接口');
    console.log('');
  });

  // 主要网络接口
  console.log('🔗 主要网络接口：');
  const primaryInterface = getPrimaryNetworkInterface();
  if (primaryInterface) {
    console.log('接口名称:', primaryInterface.name);
    console.log('主要 IP:', primaryInterface.addresses.ipv4[0]);
    console.log('MAC 地址:', primaryInterface.mac);
  } else {
    console.log('未找到主要网络接口');
  }
  console.log('');

  // 环境信息
  console.log('⚙️ 环境信息：');
  const envInfo = getEnvironmentInfo();
  console.log('Node.js 版本:', envInfo.nodeVersion);
  console.log('进程 ID:', envInfo.pid);
  console.log('当前目录:', envInfo.cwd);
  console.log('NODE_ENV:', envInfo.environmentVars.NODE_ENV || '未设置');
  console.log('');

  // 系统概览
  console.log('📈 系统概览：');
  const overview = getSystemOverview();
  console.log('时间戳:', overview.timestamp);
  console.log('CPU 型号:', overview.cpu.model);
  console.log('CPU 核心数:', overview.cpu.cores);
  console.log('内存使用率:', overview.memory.usage);
  console.log('网络接口数量:', overview.network.length);
}

// 运行测试
if (require.main === module) {
  testSystemInfo().catch(console.error);
}
```

### 运行测试

```bash
npx ts-node src/utils/system-test.ts
```

## 🔒 安全性考虑

### 1. 敏感信息过滤

```typescript
/**
 * 获取安全的系统信息（过滤敏感数据）
 * @returns 安全的系统信息
 */
export function getSecureSysInfo() {
  const sysInfo = getDetailedSysInfo();
  
  // 移除或脱敏敏感信息
  const secureInfo = {
    ...sysInfo,
    userInfo: {
      username: sysInfo.userInfo.username,
      // 移除 uid, gid, shell, homedir 等敏感信息
    },
    homeDirectory: '[FILTERED]',
    tempDirectory: '[FILTERED]',
  };
  
  return secureInfo;
}

/**
 * 获取安全的网络接口信息
 * @returns 安全的网络接口信息
 */
export function getSecureNetworkInfo() {
  const interfaces = getNetworkInterfaces();
  
  return interfaces.map(iface => ({
    name: iface.name,
    hasIPv4: iface.addresses.ipv4.length > 0,
    hasIPv6: iface.addresses.ipv6.length > 0,
    isUp: iface.isUp,
    isLoopback: iface.isLoopback,
    // 移除具体的 IP 地址和 MAC 地址
  }));
}
```

### 2. 权限检查

```typescript
/**
 * 检查系统信息获取权限
 * @returns 权限检查结果
 */
export function checkSystemInfoPermissions() {
  const permissions = {
    hostname: true,
    platform: true,
    arch: true,
    networkInterfaces: true,
    userInfo: true,
    uptime: true,
  };

  try {
    os.hostname();
  } catch (error) {
    permissions.hostname = false;
  }

  try {
    os.networkInterfaces();
  } catch (error) {
    permissions.networkInterfaces = false;
  }

  try {
    os.userInfo();
  } catch (error) {
    permissions.userInfo = false;
  }

  return permissions;
}
```

## 📈 性能优化

### 1. 系统信息缓存

```typescript
class SystemInfoCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private defaultTTL: number = 60000; // 1分钟缓存

  get(key: string, fetcher: () => any, ttl: number = this.defaultTTL): any {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < ttl) {
      return cached.data;
    }

    const data = fetcher();
    this.cache.set(key, { data, timestamp: now });
    return data;
  }

  clear(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

const systemCache = new SystemInfoCache();

/**
 * 获取缓存的系统信息
 */
export function getCachedSysInfo() {
  return systemCache.get('sysInfo', getSysInfo, 300000); // 5分钟缓存
}

export function getCachedNetworkInterfaces() {
  return systemCache.get('networkInterfaces', getNetworkInterfaces, 60000); // 1分钟缓存
}
```

## 🎉 小结

在这一章中，我们学习了：

1. **系统信息基础**：理解系统信息的重要性和类型
2. **Node.js API**：使用 os 模块获取各种系统信息
3. **网络接口处理**：获取和解析网络接口信息
4. **功能扩展**：详细信息、环境变量、系统概览
5. **安全考虑**：敏感信息过滤和权限检查
6. **性能优化**：缓存机制提高响应速度

## 🔗 下一步

现在您已经掌握了系统信息获取的实现，接下来我们将学习 [动态监控](./08-dynamic-monitoring.md)，了解如何实现实时的系统状态监控。

## 💡 常见问题

### Q: 为什么获取不到真实的 IP 地址？

A: 可能的原因：
- 多网卡环境：系统有多个网络接口
- VPN 连接：VPN 可能创建虚拟网络接口
- Docker 环境：容器内的网络配置特殊
- 防火墙设置：某些安全软件可能影响网络接口信息

### Q: 如何获取公网 IP 地址？

A: Node.js os 模块只能获取本地网络接口信息，获取公网 IP 需要：
- 调用外部 API 服务（如 ipify.org）
- 解析路由表信息
- 使用 UPnP 协议查询路由器

### Q: 系统信息会泄露安全隐患吗？

A: 是的，系统信息可能包含敏感数据：
- 主机名可能暴露内部网络结构
- IP 地址可能被用于网络攻击
- 用户信息可能被用于社会工程学攻击
- 建议在对外接口中过滤敏感信息

### Q: 如何处理权限不足的情况？

A: 可以采用以下策略：
- 优雅降级：权限不足时返回默认值
- 错误处理：捕获异常并记录日志
- 权限检查：预先检查所需权限
- 用户提示：告知用户权限要求
