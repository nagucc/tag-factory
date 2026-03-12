import { NextRequest, NextResponse } from 'next/server';
import { Role, Permission } from '@/lib/database/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const role = await Role.findByPk(id, {
      include: [
        { model: Permission, as: 'permissions', attributes: ['id', 'name', 'resource', 'action', 'description'] },
      ],
    });

    if (!role) {
      return NextResponse.json(
        { success: false, message: '角色不存在' },
        { status: 404 }
      );
    }

    const allPermissions = await Permission.findAll({
      where: { status: 1 },
      attributes: ['id', 'name', 'resource', 'action', 'description'],
    });

    const rolePermissions = (role.toJSON() as any).permissions || [];
    const rolePermissionIds = rolePermissions.map((p: any) => p.id);

    const groupedPermissions: Record<string, Permission[]> = {};
    allPermissions.forEach((permission: any) => {
      const resource = permission.resource;
      if (!groupedPermissions[resource]) {
        groupedPermissions[resource] = [];
      }
      groupedPermissions[resource].push({
        ...permission.toJSON(),
        assigned: rolePermissionIds.includes(permission.id),
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          status: role.status,
        },
        allPermissions: groupedPermissions,
        assignedPermissions: rolePermissions,
      },
    });
  } catch (error) {
    console.error('获取角色权限失败:', error);
    return NextResponse.json(
      { success: false, message: '获取角色权限失败' },
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
    const { permission_ids } = body;

    const role = await Role.findByPk(id);

    if (!role) {
      return NextResponse.json(
        { success: false, message: '角色不存在' },
        { status: 404 }
      );
    }

    if (permission_ids && Array.isArray(permission_ids)) {
      const permissions = await Permission.findAll({
        where: { id: permission_ids },
      });
      await role.setPermissions(permissions);
    }

    const updatedRole = await Role.findByPk(id, {
      include: [
        { model: Permission, as: 'permissions' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: updatedRole,
      message: '角色权限更新成功',
    });
  } catch (error) {
    console.error('更新角色权限失败:', error);
    return NextResponse.json(
      { success: false, message: '更新角色权限失败' },
      { status: 500 }
    );
  }
}
