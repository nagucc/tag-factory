import { NextRequest, NextResponse } from 'next/server';
import { WorkPlan, WorkPlanRecord, WorkPlanTag, WorkPlanMember, Tag, TagApplication } from '@/lib/database/models';
import sequelize from '@/lib/database/mysql';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const transaction = await sequelize.transaction();
  
  try {
    const { id: workPlanId } = await params;
    const body = await request.json();
    const { record_id, tag_id, user_id } = body;

    if (!record_id || !tag_id || !user_id) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '缺少必填字段' },
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

    const allowedTag = await WorkPlanTag.findOne({
      where: { work_plan_id: workPlanId, tag_id },
    });

    if (!allowedTag) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '该标签不在工作计划允许的标签列表中' },
        { status: 400 }
      );
    }

    const workPlanRecord = await WorkPlanRecord.findOne({
      where: { work_plan_id: workPlanId, record_id },
    });

    if (!workPlanRecord) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '记录不存在' },
        { status: 404 }
      );
    }

    await workPlanRecord.update({
      status: 'tagged',
      tag_id,
      tagged_by: user_id,
      tagged_at: new Date(),
    }, { transaction });

    const memberData = member.toJSON() as any;
    await member.update({
      tagged_count: (memberData.tagged_count || 0) + 1,
    }, { transaction });

    const taggedCount = await WorkPlanRecord.count({
      where: { work_plan_id: workPlanId, status: 'tagged' },
    });
    const skippedCount = await WorkPlanRecord.count({
      where: { work_plan_id: workPlanId, status: 'skipped' },
    });
    const completedCount = taggedCount + skippedCount;

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
      message: '打标成功',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('打标失败:', error);
    return NextResponse.json(
      { success: false, message: '打标失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  const transaction = await sequelize.transaction();
  
  try {
    const { id: workPlanId, recordId } = await params;
    const { searchParams } = new URL(request.url);
    const userIdStr = searchParams.get('user_id');

    if (!recordId || !userIdStr) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '缺少必填参数' },
        { status: 400 }
      );
    }

    const userId = parseInt(userIdStr);
    const workPlan = await WorkPlan.findByPk(workPlanId);
    if (!workPlan) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '工作计划不存在或已结束' },
        { status: 400 }
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
    if (recordData.tagged_by !== userId) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '只能移除自己打的标签' },
        { status: 403 }
      );
    }

    const previousTaggerId = recordData.tagged_by;
    await workPlanRecord.update({
      status: 'pending',
      tag_id: null,
      tagged_by: null,
      tagged_at: null,
    }, { transaction });

    const member = await WorkPlanMember.findOne({
      where: { work_plan_id: workPlanId, user_id: previousTaggerId },
    });

    if (member) {
      const memberData = member.toJSON() as any;
      if (memberData.tagged_count > 0) {
        await member.update({
          tagged_count: memberData.tagged_count - 1,
        }, { transaction });
      }
    }

    const taggedCount = await WorkPlanRecord.count({
      where: { work_plan_id: workPlanId, status: 'tagged' },
    });

    await workPlan.update({
      tagged_records: taggedCount,
    }, { transaction });

    await transaction.commit();

    return NextResponse.json({
      success: true,
      message: '标签移除成功',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('移除标签失败:', error);
    return NextResponse.json(
      { success: false, message: '移除标签失败' },
      { status: 500 }
    );
  }
}
