import { NextRequest, NextResponse } from 'next/server';
import { createCASProvider } from '@/lib/auth/cas/adapter';
import { getCASConfig } from '@/lib/config';

/**
 * CAS登录接口
 * 重定向到CAS服务器进行认证
 */
export async function GET(request: NextRequest) {
  try {
    // 从配置文件获取CAS配置
    const casConfig = getCASConfig();

    if (!casConfig.enabled || !casConfig.serverUrl) {
      return NextResponse.json(
        { success: false, message: 'CAS未配置或未启用' },
        { status: 400 }
      );
    }

    // 构建服务URL（CAS回调地址）
    const serviceUrl = `${request.nextUrl.origin}/api/auth/cas/callback`;

    // 创建CAS Provider
    const casProvider = createCASProvider({
      serverUrl: casConfig.serverUrl,
      serviceUrl,
      version: casConfig.version,
      strictSSL: casConfig.strictSSL,
      pathPrefix: casConfig.pathPrefix,
    });

    // 获取CAS登录URL并重定向
    const loginUrl = casProvider.getLoginUrl();
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('CAS登录错误:', error);
    return NextResponse.json(
      { success: false, message: 'CAS登录失败' },
      { status: 500 }
    );
  }
}
