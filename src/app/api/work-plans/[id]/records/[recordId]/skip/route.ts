import { NextRequest, NextResponse } from 'next/server';
import { WorkPlan, WorkPlanRecord, WorkPlanMember } from '@/lib/database/models';
import sequelize from '@/lib/database/mysql';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  const transaction = await sequelize.transaction();
  
  try {
    const { id: workPlanId, recordId } = await params;
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '缺少用户ID' },
        { status: 400 }
      );
    }

    const workPlan = await WorkPlan.findByPk(workPlanId);
    if (!workPlan) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '工作计划不存在' },
        { status: 404 }
      );
    }

    const workPlanData = workPlan.toJSON() as any;
    if (workPlanData.status !== 'active') {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '工作计划不存在或已结束' },
        { status: 400 }
      );
    }

    const member = await WorkPlanMember.findOne({
      where: { work_plan_id: workPlanId, user_id },
    });

    if (!member) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '您不是该工作计划的成员' },
        { status: 403 }
      );
    }

    const workPlanRecord = await WorkPlanRecord.findOne({
      where: { work_plan_id: workPlanId, record_id: recordId },
    });

    if (!workPlanRecord) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '记录不存在' },
        { status: 404 }
      );
    }

    const recordData = workPlanRecord.toJSON() as any;
    if (recordData.status === 'tagged' || recordData.status === 'skipped') {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '该记录已处理' },
        { status: 400 }
      );
    }

    await workPlanRecord.update({
      status: 'skipped',
      tag_id: null,
      tagged_by: user_id,
      tagged_at: new Date(),
    }, { transaction });

    const memberData = member.toJSON() as any;
    await member.update({
      tagged_count: (memberData.tagged_count || 0) + 1,
    }, { transaction });

    const completedCount = await WorkPlanRecord.count({
      where: { 
        work_plan_id: workPlanId, 
        status: { [require('sequelize').Op.in]: ['tagged', 'skipped'] }
      },
    });

    await workPlan.update({
      tagged_records: completedCount,
    }, { transaction });

    const progress = workPlanData.total_records > 0 
      ? Math.round((completedCount / workPlanData.total_records) * 100) 
      : 0;

    await transaction.commit();

    return NextResponse.json({
      success: true,
      data: {
        memberTaggedCount: (memberData.tagged_count || 0) + 1,
        progress,
      },
      message: '已标记为跳过',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('跳过记录失败:', error);
    return NextResponse.json(
      { success: false, message: '跳过记录失败' },
      { status: 500 }
    );
  }
}
