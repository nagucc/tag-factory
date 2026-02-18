import { NextRequest, NextResponse } from 'next/server';
import { WorkPlan, WorkPlanRecord, WorkPlanMember, Tag as TagModel, TagApplication } from '@/lib/database/models';
import sequelize from '@/lib/database/mysql';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const transaction = await sequelize.transaction();
  
  try {
    const { id: workPlanId } = await params;
    const body = await request.json();
    const { record_ids, tag_id, user_id } = body;

    if (!record_ids || !record_ids.length || !user_id) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '缺少必填参数' },
        { status: 400 }
      );
    }

    if (!tag_id) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '请选择要打的标签' },
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

    const tag = await TagModel.findByPk(tag_id);
    if (!tag) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '标签不存在' },
        { status: 404 }
      );
    }

    let successCount = 0;
    let skipCount = 0;

    for (const recordId of record_ids) {
      const workPlanRecord = await WorkPlanRecord.findOne({
        where: { work_plan_id: workPlanId, record_id: recordId },
      });

      if (!workPlanRecord) {
        skipCount++;
        continue;
      }

      const recordData = workPlanRecord.toJSON() as any;
      if (recordData.status === 'tagged' || recordData.status === 'skipped') {
        skipCount++;
        continue;
      }

      await workPlanRecord.update({
        status: 'tagged',
        tag_id,
        tagged_by: user_id,
        tagged_at: new Date(),
      }, { transaction });

      await TagApplication.create({
        tag_id,
        data_object_id: workPlanData.data_object_id,
        record_id: recordId || null,
        applied_by: user_id,
        applied_at: new Date(),
        source: 'workplan',
        status: 'active',
      }, { transaction });

      successCount++;
    }

    const memberData = member.toJSON() as any;
    await member.update({
      tagged_count: (memberData.tagged_count || 0) + successCount,
    }, { transaction });

    const [taggedCount, skippedCount] = await Promise.all([
      WorkPlanRecord.count({ where: { work_plan_id: workPlanId, status: 'tagged' } }),
      WorkPlanRecord.count({ where: { work_plan_id: workPlanId, status: 'skipped' } }),
    ]);
    const completedCount = taggedCount + skippedCount;

    await workPlan.update({
      tagged_records: completedCount,
    }, { transaction });

    await transaction.commit();

    return NextResponse.json({
      success: true,
      data: {
        successCount,
        skipCount,
        total: record_ids.length,
      },
      message: `成功为 ${successCount} 条记录打标，${skipCount} 条已处理过`,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('批量打标失败:', error);
    return NextResponse.json(
      { success: false, message: '批量打标失败' },
      { status: 500 }
    );
  }
}
