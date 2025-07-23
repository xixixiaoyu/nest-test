import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import {
  getCpuInfo,
  getMemInfo,
  getDiskInfo,
  getSysInfo,
  getDynamicCpuUsage,
} from './utils/system-info';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * 获取服务器状态信息
   * @returns 包含 CPU、内存、磁盘和系统信息的对象
   */
  @Get('status')
  async getStatus() {
    // 并行获取所有信息，提高效率
    const [cpu, mem, disk, sys] = await Promise.all([
      Promise.resolve(getCpuInfo()),
      Promise.resolve(getMemInfo()),
      getDiskInfo(),
      Promise.resolve(getSysInfo()),
    ]);

    return {
      cpu,
      mem,
      disk,
      sys,
    };
  }

  /**
   * 获取动态 CPU 使用率（需要等待 1 秒采样）
   * @returns CPU 动态使用情况
   */
  @Get('status/cpu-dynamic')
  async getDynamicCpuStatus() {
    return await getDynamicCpuUsage();
  }

  /**
   * 获取 CPU 信息
   * @returns CPU 使用情况
   */
  @Get('status/cpu')
  getCpuStatus() {
    return getCpuInfo();
  }

  /**
   * 获取内存信息
   * @returns 内存使用情况
   */
  @Get('status/memory')
  getMemoryStatus() {
    return getMemInfo();
  }

  /**
   * 获取磁盘信息
   * @returns 磁盘使用情况
   */
  @Get('status/disk')
  async getDiskStatus() {
    return await getDiskInfo();
  }

  /**
   * 获取系统信息
   * @returns 系统基本信息
   */
  @Get('status/system')
  getSystemInfo() {
    return getSysInfo();
  }
}
