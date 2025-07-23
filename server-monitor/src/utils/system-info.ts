import * as os from 'os';
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
