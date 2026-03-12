import { NextRequest, NextResponse } from 'next/server';
import { getConfig, getAppConfig, getSecurityConfig, getCASConfig, reloadConfig } from '@/lib/config';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export async function GET(request: NextRequest) {
  try {
    const appConfig = getAppConfig();
    const securityConfig = getSecurityConfig();
    const casConfig = getCASConfig();

    const config = {
      appName: appConfig.name,
      appEnv: appConfig.env,
      jwtExpiresIn: getConfig().jwt.expiresIn,
      maxLoginAttempts: securityConfig.maxLoginAttempts,
      lockoutDuration: securityConfig.lockoutDuration,
      casEnabled: casConfig.enabled && !!casConfig.serverUrl,
      casServerUrl: casConfig.serverUrl,
      casPathPrefix: casConfig.pathPrefix,
      casVersion: casConfig.version,
    };

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('获取系统配置失败:', error);
    return NextResponse.json(
      { success: false, message: '获取系统配置失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 读取当前配置文件
    const configPath = path.resolve(process.cwd(), 'config', 'config.yaml');
    let currentConfig: Record<string, unknown> = {};
    
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf8');
      currentConfig = yaml.load(fileContent) as Record<string, unknown>;
    }

    // 更新配置
    const updatedConfig = {
      ...currentConfig,
      app: {
        ...(currentConfig.app as Record<string, unknown> || {}),
        name: body.appName,
        env: body.appEnv,
      },
      security: {
        ...(currentConfig.security as Record<string, unknown> || {}),
        maxLoginAttempts: body.maxLoginAttempts,
        lockoutDuration: body.lockoutDuration,
      },
      jwt: {
        ...(currentConfig.jwt as Record<string, unknown> || {}),
        expiresIn: body.jwtExpiresIn,
      },
      cas: {
        ...(currentConfig.cas as Record<string, unknown> || {}),
        enabled: body.casEnabled,
        serverUrl: body.casServerUrl,
        pathPrefix: body.casPathPrefix,
        version: body.casVersion,
      },
    };

    // 写入配置文件
    const yamlContent = yaml.dump(updatedConfig, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
    });
    fs.writeFileSync(configPath, yamlContent, 'utf8');

    // 重新加载配置
    reloadConfig();
    
    return NextResponse.json({
      success: true,
      message: '系统配置已更新',
    });
  } catch (error) {
    console.error('更新系统配置失败:', error);
    return NextResponse.json(
      { success: false, message: '更新系统配置失败' },
      { status: 500 }
    );
  }
}
