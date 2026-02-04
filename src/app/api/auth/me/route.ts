import { NextRequest, NextResponse } from 'next/server';
import sequelize from '@/lib/database/mysql';
import { QueryTypes } from 'sequelize';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未认证' },
        { status: 401 }
      );
    }

    interface UserResult {
      id: number;
      username: string;
      email: string;
      role_id: number;
      role_name: string;
      status: number;
      last_login: Date | null;
    }

    const users: UserResult[] = await sequelize.query(
      `SELECT u.id, u.username, u.email, u.role_id, r.name as role_name, u.status, u.last_login 
       FROM tagfactory_users u 
       LEFT JOIN tagfactory_roles r ON u.role_id = r.id 
       WHERE u.id = :userId`,
      {
        replacements: { userId: parseInt(userId) },
        type: QueryTypes.SELECT
      }
    );

    const user = users[0];
    
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

    interface PermissionResult {
      resource: string;
      action: string;
    }

    const permissions: PermissionResult[] = await sequelize.query(
      `SELECT p.resource, p.action 
       FROM tagfactory_permissions p
       JOIN tagfactory_role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = :roleId`,
      {
        replacements: { roleId: user.role_id },
        type: QueryTypes.SELECT
      }
    );

    const permissionNames = permissions.map(p => `${p.resource}:${p.action}`);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role_name,
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
