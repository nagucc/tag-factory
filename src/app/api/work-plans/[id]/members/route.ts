import { NextRequest, NextResponse } from 'next/server';
import { WorkPlanMember, User, WorkPlan } from '@/lib/database/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const members = await WorkPlanMember.findAll({
      where: { work_plan_id: id },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
      ],
      order: [['role', 'ASC'], ['joined_at', 'DESC']],
    });

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error('获取工作计划成员失败:', error);
    return NextResponse.json(
      { success: false, message: '获取工作计划成员失败' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_id, role } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, message: '缺少用户ID' },
        { status: 400 }
      );
    }

    const workPlan = await WorkPlan.findByPk(id);
    if (!workPlan) {
      return NextResponse.json(
        { success: false, message: '工作计划不存在' },
        { status: 404 }
      );
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 400 }
      );
    }

    const [member, created] = await WorkPlanMember.findOrCreate({
      where: {
        work_plan_id: id,
        user_id,
      },
      defaults: {
        role: role || 'member',
        tagged_count: 0,
        joined_at: new Date(),
      },
    });

    if (!created) {
      return NextResponse.json(
        { success: false, message: '该成员已存在' },
        { status: 400 }
      );
    }

    const fullMember = await WorkPlanMember.findByPk((member.toJSON() as any).id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
      ],
    });

    return NextResponse.json({
      success: true,
      data: fullMember,
      message: '成员添加成功',
    });
  } catch (error) {
    console.error('添加工作计划成员失败:', error);
    return NextResponse.json(
      { success: false, message: '添加工作计划成员失败' },
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: '缺少用户ID' },
        { status: 400 }
      );
    }

    const memberUserId = parseInt(userId);

    const member = await WorkPlanMember.findOne({
      where: { work_plan_id: id, user_id: memberUserId },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: '成员不存在' },
        { status: 404 }
      );
    }

    const memberData = member.toJSON() as any;
    if (memberData.role === 'owner') {
      return NextResponse.json(
        { success: false, message: '不能移除所有者' },
        { status: 400 }
      );
    }

    await member.destroy();

    return NextResponse.json({
      success: true,
      message: '成员移除成功',
    });
  } catch (error) {
    console.error('移除工作计划成员失败:', error);
    return NextResponse.json(
      { success: false, message: '移除工作计划成员失败' },
      { status: 500 }
    );
  }
}
