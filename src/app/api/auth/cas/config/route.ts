import { NextResponse } from 'next/server';
import { getCASConfig } from '@/lib/config';

/**
 * CAS配置查询接口
 * 返回CAS是否启用的状态
 */
export async function GET() {
  try {
    const casConfig = getCASConfig();
    
    return NextResponse.json({
      success: true,
      enabled: casConfig.enabled && !!casConfig.serverUrl,
      serverUrl: casConfig.serverUrl || null,
      version: casConfig.version,
    });
  } catch (error) {
    console.error('获取CAS配置错误:', error);
    return NextResponse.json(
      { success: false, enabled: false },
      { status: 500 }
    );
  }
}
