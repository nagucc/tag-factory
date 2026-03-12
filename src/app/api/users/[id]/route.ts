import { NextRequest, NextResponse } from 'next/server';
import { User, Role, LoginLog } from '@/lib/database/models';
import bcrypt from 'bcrypt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const userData = user.toJSON();
    return NextResponse.json({
      success: true,
      data: {
        ...userData,
        role_name: userData.role?.name,
        role_description: userData.role?.description,
      },
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    return NextResponse.json(
      { success: false, message: '获取用户详情失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { username, email, role_id, status, name } = body;

    const user = await User.findByPk(id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const userData = user.toJSON() as any;

    if (username && username !== userData.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: '用户名已存在' },
          { status: 400 }
        );
      }
    }

    if (email && email !== userData.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return NextResponse.json(
          { success: false, message: '邮箱已被使用' },
          { status: 400 }
        );
      }
    }

    await user.update({
      username: username || userData.username,
      email: email || userData.email,
      role_id: role_id !== undefined ? role_id : userData.role_id,
      status: status !== undefined ? status : userData.status,
    });

    const updatedUser = await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: '用户更新成功',
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    return NextResponse.json(
      { success: false, message: '更新用户失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await User.findByPk(id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    await user.update({ status: 0 });

    return NextResponse.json({
      success: true,
      message: '用户已禁用',
    });
  } catch (error) {
    console.error('禁用用户失败:', error);
    return NextResponse.json(
      { success: false, message: '禁用用户失败' },
      { status: 500 }
    );
  }
}
