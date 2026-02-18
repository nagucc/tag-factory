import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import { DataSource, DataObject, Tag, WorkPlan, User } from '@/lib/database/models';

export async function GET(request: NextRequest) {
  try {
    const cpuLoad = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = (usedMem / totalMem) * 100;

    const cpus = os.cpus();
    let idleTotal = 0;
    let totalTick = 0;
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      idleTotal += cpu.times.idle;
    });
    const cpuUsagePercent = 100 - (idleTotal / totalTick * 100);

    const [dataSourceCount, dataObjectCount, tagCount, workPlanCount, userCount] = await Promise.all([
      DataSource.count(),
      DataObject.count(),
      Tag.count(),
      WorkPlan.count(),
      User.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        system: {
          hostname: os.hostname(),
          platform: os.platform(),
          uptime: os.uptime(),
          cpuCount: os.cpus().length,
        },
        cpu: {
          load1: cpuLoad[0],
          load5: cpuLoad[1],
          load15: cpuLoad[2],
          usagePercent: cpuUsagePercent,
        },
        memory: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
          usagePercent: memUsagePercent,
        },
        stats: {
          dataSourceCount,
          dataObjectCount,
          tagCount,
          workPlanCount,
          userCount,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('获取系统指标失败:', error);
    return NextResponse.json(
      { success: false, message: '获取系统指标失败' },
      { status: 500 }
    );
  }
}
