import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/database/models';
import bcrypt from 'bcrypt';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, message: '密码不能为空' },
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

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({ password: hashedPassword });

    return NextResponse.json({
      success: true,
      message: '密码重置成功',
    });
  } catch (error) {
    console.error('重置密码失败:', error);
    return NextResponse.json(
      { success: false, message: '重置密码失败' },
      { status: 500 }
    );
  }
}
