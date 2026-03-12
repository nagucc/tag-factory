import { NextRequest, NextResponse } from 'next/server';
import { User, Role, LoginLog } from '@/lib/database/models';
import { WhereOptions } from 'sequelize';
import bcrypt from 'bcrypt';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const username = searchParams.get('username');
    const email = searchParams.get('email');
    const status = searchParams.get('status');
    const role_id = searchParams.get('role_id');

    const where: any = {};
    if (username) {
      where.username = { $like: `%${username}%` };
    }
    if (email) {
      where.email = { $like: `%${email}%` };
    }
    if (status) {
      where.status = parseInt(status);
    }
    if (role_id) {
      where.role_id = parseInt(role_id);
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name', 'description'] },
      ],
      attributes: { exclude: ['password'] },
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['id', 'DESC']],
    });

    const users = rows.map(user => {
      const userData = user.toJSON();
      return {
        ...userData,
        role_name: userData.role?.name,
        role_description: userData.role?.description,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        list: users,
        pagination: {
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, role_id = 2, status = 1 } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: '用户名、邮箱和密码不能为空' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: '用户名已存在' },
        { status: 400 }
      );
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: '邮箱已被使用' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role_id,
      status,
    });

    const userWithRole = await User.findByPk((user as any).id, {
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] },
    });

    return NextResponse.json({
      success: true,
      data: userWithRole,
      message: '用户创建成功',
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    return NextResponse.json(
      { success: false, message: '创建用户失败' },
      { status: 500 }
    );
  }
}
