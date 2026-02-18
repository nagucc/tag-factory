import { NextRequest, NextResponse } from 'next/server';
import { User, Role } from '@/lib/database/models';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role_id } = body;

    if (role_id === undefined) {
      return NextResponse.json(
        { success: false, message: '角色ID不能为空' },
        { status: 400 }
      );
    }

    const user = await User.findByPk(id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const role = await Role.findByPk(role_id);
    if (!role) {
      return NextResponse.json(
        { success: false, message: '角色不存在' },
        { status: 404 }
      );
    }

    await user.update({ role_id });

    const updatedUser = await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: '用户角色分配成功',
    });
  } catch (error) {
    console.error('分配角色失败:', error);
    return NextResponse.json(
      { success: false, message: '分配角色失败' },
      { status: 500 }
    );
  }
}
