import { NextRequest, NextResponse } from 'next/server';
import sequelize from '@/lib/database/mysql';
import { 
  generateToken, 
  comparePassword, 
  checkAccountLockout, 
  incrementLoginAttempts, 
  resetLoginAttempts
} from '@/lib/auth';
import { QueryTypes } from 'sequelize';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    interface User {
      id: number;
      username: string;
      email: string;
      password: string;
      role_id: number;
      status: number;
      failed_login_attempts: number;
      locked_until: Date | null;
      last_login: Date | null;
    }

    const users: User[] = await sequelize.query(
      `SELECT id, username, email, password, role_id, status, failed_login_attempts, locked_until, last_login 
       FROM tagfactory_users WHERE username = :username`,
      {
        replacements: { username },
        type: QueryTypes.SELECT
      }
    );

    const user = users[0];

    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      );
    }

    if (user.status === 0) {
      return NextResponse.json(
        { success: false, message: '账户已被禁用，请联系管理员' },
        { status: 403 }
      );
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingTime = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 1000 / 60);
      return NextResponse.json(
        { 
          success: false, 
          message: `账户已被锁定，请 ${remainingTime} 分钟后重试` 
        },
        { status: 423 }
      );
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      const attempts = user.failed_login_attempts + 1;
      if (attempts >= 5) {
        await sequelize.query(
          `UPDATE tagfactory_users SET failed_login_attempts = :attempts, locked_until = :lockedUntil WHERE id = :id`,
          {
            replacements: { 
              attempts, 
              lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
              id: user.id 
            },
            type: QueryTypes.UPDATE
          }
        );
      } else {
        await sequelize.query(
          `UPDATE tagfactory_users SET failed_login_attempts = :attempts WHERE id = :id`,
          {
            replacements: { attempts, id: user.id },
            type: QueryTypes.UPDATE
          }
        );
      }
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      );
    }

    await sequelize.query(
      `UPDATE tagfactory_users SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = :id`,
      {
        replacements: { id: user.id },
        type: QueryTypes.UPDATE
      }
    );

    interface RoleResult {
      id: number;
      name: string;
    }

    const roles: RoleResult[] = await sequelize.query(
      `SELECT id, name FROM tagfactory_roles WHERE id = :roleId`,
      {
        replacements: { roleId: user.role_id },
        type: QueryTypes.SELECT
      }
    );

    const role = roles[0];

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

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      roleId: user.role_id,
      roleName: role?.name || 'user',
    };

    const token = generateToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: role?.name,
        },
        permissions: permissionNames,
        token,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
