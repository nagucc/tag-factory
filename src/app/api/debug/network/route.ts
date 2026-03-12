import { NextResponse } from 'next/server';
import { getCASConfig } from '@/lib/config';

/**
 * 网络诊断接口
 * 用于测试与 CAS 服务器的连通性
 */
export async function GET() {
  try {
    const casConfig = getCASConfig();
    
    if (!casConfig.enabled || !casConfig.serverUrl) {
      return NextResponse.json({
        success: false,
        message: 'CAS 未配置',
        casConfig: {
          enabled: casConfig.enabled,
          serverUrl: casConfig.serverUrl,
        },
      });
    }

    const results: Record<string, unknown> = {
      casConfig: {
        enabled: casConfig.enabled,
        serverUrl: casConfig.serverUrl,
        pathPrefix: casConfig.pathPrefix,
        version: casConfig.version,
      },
      tests: {},
    };

    // 测试 DNS 解析
    try {
      const url = new URL(casConfig.serverUrl);
      const hostname = url.hostname;
      results.dns = {
        hostname,
        resolved: true,
      };
    } catch (error) {
      results.dns = {
        resolved: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // 测试连接 CAS 服务器（仅测试根路径）
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(casConfig.serverUrl, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      results.connectivity = {
        reachable: true,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      results.connectivity = {
        reachable: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // 测试登录页面
    const loginUrl = `${casConfig.serverUrl}${casConfig.pathPrefix || ''}/login`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(loginUrl, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      results.loginPage = {
        reachable: true,
        url: loginUrl,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      results.loginPage = {
        reachable: false,
        url: loginUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Network diagnostic error:', error);
    return NextResponse.json(
      {
        success: false,
        message: '网络诊断失败',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
