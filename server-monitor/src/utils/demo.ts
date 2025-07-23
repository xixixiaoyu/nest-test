/**
 * 服务器监控 API 演示文件
 * 
 * 本文件展示了如何使用系统信息获取函数的完整示例
 * 包含详细的注释和使用说明
 */

import { getCpuInfo, getMemInfo, getDiskInfo, getSysInfo, getDynamicCpuUsage } from './system-info';

/**
 * 演示如何获取所有系统信息
 */
async function demonstrateSystemMonitoring() {
  console.log('🚀 开始演示服务器监控功能...\n');

  // 1. 获取 CPU 信息
  console.log('📊 获取 CPU 信息：');
  const cpuInfo = getCpuInfo();
  console.log('CPU 核心数:', cpuInfo.cpuNum);
  console.log('系统使用率:', cpuInfo.sys);
  console.log('用户使用率:', cpuInfo.used);
  console.log('空闲率:', cpuInfo.free);
  console.log('');

  // 2. 获取内存信息
  console.log('💾 获取内存信息：');
  const memInfo = getMemInfo();
  console.log('总内存:', memInfo.total);
  console.log('已用内存:', memInfo.used);
  console.log('空闲内存:', memInfo.free);
  console.log('使用率:', memInfo.usage);
  console.log('');

  // 3. 获取磁盘信息
  console.log('💿 获取磁盘信息：');
  try {
    const diskInfo = await getDiskInfo();
    diskInfo.forEach((disk, index) => {
      console.log(`磁盘 ${index + 1}:`);
      console.log('  挂载点:', disk.mounted);
      console.log('  文件系统:', disk.filesystem);
      console.log('  总空间:', disk.total);
      console.log('  已用空间:', disk.used);
      console.log('  剩余空间:', disk.free);
      console.log('  使用率:', disk.usage);
      console.log('');
    });
  } catch (error) {
    console.error('获取磁盘信息失败:', error);
  }

  // 4. 获取系统信息
  console.log('🖥️ 获取系统信息：');
  const sysInfo = getSysInfo();
  console.log('主机名:', sysInfo.computerName);
  console.log('IP 地址:', sysInfo.computerIp);
  console.log('操作系统:', sysInfo.osName);
  console.log('架构:', sysInfo.osArch);
  console.log('');

  // 5. 获取动态 CPU 使用率（需要等待 1 秒）
  console.log('⏱️ 获取动态 CPU 使用率（需要等待 1 秒）：');
  try {
    const dynamicCpuInfo = await getDynamicCpuUsage();
    console.log('CPU 核心数:', dynamicCpuInfo.cpuNum);
    console.log('系统使用率:', dynamicCpuInfo.sys);
    console.log('用户使用率:', dynamicCpuInfo.used);
    console.log('空闲率:', dynamicCpuInfo.free);
    console.log('');
  } catch (error) {
    console.error('获取动态 CPU 信息失败:', error);
  }

  console.log('✅ 演示完成！');
}

/**
 * 演示如何格式化输出完整的服务器状态
 */
async function demonstrateFormattedOutput() {
  console.log('\n📋 格式化输出完整服务器状态：');
  console.log('=' .repeat(50));

  try {
    // 并行获取所有信息
    const [cpu, mem, disk, sys] = await Promise.all([
      Promise.resolve(getCpuInfo()),
      Promise.resolve(getMemInfo()),
      getDiskInfo(),
      Promise.resolve(getSysInfo()),
    ]);

    const serverStatus = {
      timestamp: new Date().toISOString(),
      cpu,
      mem,
      disk,
      sys,
    };

    console.log(JSON.stringify(serverStatus, null, 2));
  } catch (error) {
    console.error('获取服务器状态失败:', error);
  }
}

/**
 * 演示如何监控特定资源的使用率
 */
function demonstrateResourceMonitoring() {
  console.log('\n⚠️ 资源使用率监控演示：');
  console.log('=' .repeat(50));

  const cpuInfo = getCpuInfo();
  const memInfo = getMemInfo();

  // 检查 CPU 使用率
  const cpuUsage = parseFloat(cpuInfo.used.replace('%', ''));
  if (cpuUsage > 80) {
    console.log('🔴 警告：CPU 使用率过高！', cpuInfo.used);
  } else if (cpuUsage > 60) {
    console.log('🟡 注意：CPU 使用率较高', cpuInfo.used);
  } else {
    console.log('🟢 正常：CPU 使用率正常', cpuInfo.used);
  }

  // 检查内存使用率
  const memUsage = parseFloat(memInfo.usage.replace('%', ''));
  if (memUsage > 85) {
    console.log('🔴 警告：内存使用率过高！', memInfo.usage);
  } else if (memUsage > 70) {
    console.log('🟡 注意：内存使用率较高', memInfo.usage);
  } else {
    console.log('🟢 正常：内存使用率正常', memInfo.usage);
  }
}

/**
 * 主函数 - 运行所有演示
 */
async function main() {
  try {
    await demonstrateSystemMonitoring();
    await demonstrateFormattedOutput();
    demonstrateResourceMonitoring();
  } catch (error) {
    console.error('演示过程中发生错误:', error);
  }
}

// 如果直接运行此文件，则执行演示
if (require.main === module) {
  main();
}

export {
  demonstrateSystemMonitoring,
  demonstrateFormattedOutput,
  demonstrateResourceMonitoring,
  main,
};
