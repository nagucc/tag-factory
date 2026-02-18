import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/database/models';
import { Op } from 'sequelize';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_ids, action } = body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { success: false, message: '请选择要操作的用户' },
        { status: 400 }
      );
    }

    if (!['enable', 'disable', 'delete'].includes(action)) {
      return NextResponse.json(
        { success: false, message: '无效的操作类型' },
        { status: 400 }
      );
    }

    let result;
    switch (action) {
      case 'enable':
        result = await User.update(
          { status: 1 },
          { where: { id: { [Op.in]: user_ids } } }
        );
        break;
      case 'disable':
        result = await User.update(
          { status: 0 },
          { where: { id: { [Op.in]: user_ids } } }
        );
        break;
      case 'delete':
        result = await User.update(
          { status: -1 },
          { where: { id: { [Op.in]: user_ids } } }
        );
        break;
    }

    return NextResponse.json({
      success: true,
      message: `成功操作 ${user_ids.length} 个用户`,
    });
  } catch (error) {
    console.error('批量操作失败:', error);
    return NextResponse.json(
      { success: false, message: '批量操作失败' },
      { status: 500 }
    );
  }
}
