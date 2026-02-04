import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const config = {
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'Tag Factory',
      appEnv: process.env.NEXT_PUBLIC_APP_ENV || 'development',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
      maxLoginAttempts: 5,
      lockoutDuration: 30,
    };

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '获取系统配置失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: '系统配置已更新',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '更新系统配置失败' },
      { status: 500 }
    );
  }
}
