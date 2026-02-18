import { NextRequest, NextResponse } from 'next/server';
import { Role, Permission, User } from '@/lib/database/models';
import { WhereOptions } from 'sequelize';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const name = searchParams.get('name');
    const status = searchParams.get('status');

    const where: WhereOptions<Role> = {};
    if (name) {
      where.name = { $like: `%${name}%` };
    }
    if (status) {
      where.status = parseInt(status);
    }

    const { count, rows } = await Role.findAndCountAll({
      where,
      include: [
        { model: Permission, as: 'permissions', attributes: ['id', 'name', 'resource', 'action', 'description'] },
        { model: User, as: 'users', attributes: ['id'] },
      ],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    const roles = rows.map(role => {
      const roleData = role.toJSON();
      return {
        ...roleData,
        permissionCount: roleData.permissions?.length || 0,
        userCount: roleData.users?.length || 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        list: roles,
        pagination: {
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取角色列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取角色列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, status = 1, permission_ids = [] } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: '角色名称不能为空' },
        { status: 400 }
      );
    }

    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return NextResponse.json(
        { success: false, message: '角色名称已存在' },
        { status: 400 }
      );
    }

    const role = await Role.create({
      name,
      description,
      status,
    });

    if (permission_ids.length > 0) {
      const permissions = await Permission.findAll({
        where: { id: permission_ids },
      });
      await role.setPermissions(permissions);
    }

    const roleWithPermissions = await Role.findByPk(role.id, {
      include: [{ model: Permission, as: 'permissions' }],
    });

    return NextResponse.json({
      success: true,
      data: roleWithPermissions,
      message: '角色创建成功',
    });
  } catch (error) {
    console.error('创建角色失败:', error);
    return NextResponse.json(
      { success: false, message: '创建角色失败' },
      { status: 500 }
    );
  }
}
