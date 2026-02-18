import { NextRequest, NextResponse } from 'next/server';
import { Role, Permission, User } from '@/lib/database/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const role = await Role.findByPk(id, {
      include: [
        { model: Permission, as: 'permissions', attributes: ['id', 'name', 'resource', 'action', 'description'] },
        { model: User, as: 'users', attributes: ['id', 'username', 'email'] },
      ],
    });

    if (!role) {
      return NextResponse.json(
        { success: false, message: '角色不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error('获取角色详情失败:', error);
    return NextResponse.json(
      { success: false, message: '获取角色详情失败' },
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
    const { name, description, status } = body;

    const role = await Role.findByPk(id);

    if (!role) {
      return NextResponse.json(
        { success: false, message: '角色不存在' },
        { status: 404 }
      );
    }

    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ where: { name } });
      if (existingRole) {
        return NextResponse.json(
          { success: false, message: '角色名称已存在' },
          { status: 400 }
        );
      }
    }

    await role.update({
      name: name || role.name,
      description: description !== undefined ? description : role.description,
      status: status !== undefined ? status : role.status,
    });

    const updatedRole = await Role.findByPk(id, {
      include: [{ model: Permission, as: 'permissions' }],
    });

    return NextResponse.json({
      success: true,
      data: updatedRole,
      message: '角色更新成功',
    });
  } catch (error) {
    console.error('更新角色失败:', error);
    return NextResponse.json(
      { success: false, message: '更新角色失败' },
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

    const role = await Role.findByPk(id, {
      include: [{ model: User, as: 'users' }],
    });

    if (!role) {
      return NextResponse.json(
        { success: false, message: '角色不存在' },
        { status: 404 }
      );
    }

    const roleData = role.toJSON();
    if (roleData.users && roleData.users.length > 0) {
      return NextResponse.json(
        { success: false, message: '该角色下有用户，无法删除' },
        { status: 400 }
      );
    }

    if (role.name === 'admin' || role.name === 'user') {
      return NextResponse.json(
        { success: false, message: '系统默认角色无法删除' },
        { status: 400 }
      );
    }

    await role.destroy();

    return NextResponse.json({
      success: true,
      message: '角色删除成功',
    });
  } catch (error) {
    console.error('删除角色失败:', error);
    return NextResponse.json(
      { success: false, message: '删除角色失败' },
      { status: 500 }
    );
  }
}
