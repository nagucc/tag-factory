import { NextRequest, NextResponse } from 'next/server';
import { User, Role, Permission } from '@/lib/database/models';
import { verifyToken, extractTokenFromHeader, getUserWithRole } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: '未提供认证令牌' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: '无效或过期的认证令牌' },
        { status: 401 }
      );
    }

    const { user, permissions } = await getUserWithRole(decoded.userId) || { user: null, permissions: [] };

    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    if (user.status === 0) {
      return NextResponse.json(
        { success: false, message: '账户已被禁用' },
        { status: 403 }
      );
    }

    const permissionNames = permissions.map(p => `${p.resource}:${p.action}`);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: (user as any).role?.name || decoded.roleName,
          lastLogin: user.last_login,
        },
        permissions: permissionNames,
      },
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
