import { NextRequest, NextResponse } from 'next/server';
import { WorkPlan, WorkPlanRecord, WorkPlanTag, Tag, DataRecord, TagApplication, AITagTask } from '@/lib/database/models';
import sequelize from '@/lib/database/mysql';
import { isAIConfigured } from '@/lib/services/openai';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const transaction = await sequelize.transaction();

  try {
    if (!isAIConfigured()) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: 'AI功能未配置，请设置 OPENAI_API_KEY 环境变量' },
        { status: 400 }
      );
    }

    const { id: workPlanId } = await params;
    const body = await request.json();
    const { prompt, page_size = 50, preview_results, user_id } = body;

    if (!user_id) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '缺少用户信息' },
        { status: 400 }
      );
    }

    if (!preview_results || !Array.isArray(preview_results) || preview_results.length === 0) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '请先进行AI打标预览' },
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
        { success: false, message: '工作计划已结束，无法进行打标' },
        { status: 400 }
      );
    }

    const aiTagTask = await AITagTask.create({
      work_plan_id: parseInt(workPlanId),
      prompt: prompt || '',
      page_size: parseInt(page_size) || 50,
      total_records: preview_results.length,
      success_count: 0,
      fail_count: 0,
      status: 'running',
      result_json: preview_results,
      user_id: user_id,
    }, { transaction });

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const rec of preview_results) {
      if (!rec.tag_id) {
        skipCount++;
        continue;
      }

      const workPlanRecord = await WorkPlanRecord.findOne({
        where: { work_plan_id: workPlanId, record_id: rec.record_id },
      });

      if (!workPlanRecord) {
        failCount++;
        continue;
      }

      const recordData = workPlanRecord.toJSON() as any;
      if (recordData.status === 'tagged' || recordData.status === 'skipped') {
        skipCount++;
        continue;
      }

      const tag = await Tag.findByPk(rec.tag_id);
      if (!tag) {
        failCount++;
        continue;
      }

      await workPlanRecord.update({
        status: 'tagged',
        tag_id: rec.tag_id,
        tagged_by: user_id,
        tagged_at: new Date(),
      }, { transaction });

      await TagApplication.create({
        tag_id: rec.tag_id,
        data_object_id: workPlanData.data_object_id,
        record_id: rec.record_id,
        applied_by: user_id,
        applied_at: new Date(),
        source: 'workplan',
        status: 'active',
      }, { transaction });

      successCount++;
    }

    const [taggedCount, skippedCount] = await Promise.all([
      WorkPlanRecord.count({ where: { work_plan_id: workPlanId, status: 'tagged' } }),
      WorkPlanRecord.count({ where: { work_plan_id: workPlanId, status: 'skipped' } }),
    ]);

    await workPlan.update({
      tagged_records: taggedCount + skippedCount,
    }, { transaction });

    await aiTagTask.update({
      success_count: successCount,
      fail_count: failCount,
      status: 'completed',
    }, { transaction });

    await transaction.commit();

    return NextResponse.json({
      success: true,
      data: {
        task_id: (aiTagTask as any).id,
        success_count: successCount,
        skip_count: skipCount,
        fail_count: failCount,
        total: preview_results.length,
      },
      message: `成功打标 ${successCount} 条，跳过 ${skipCount} 条，失败 ${failCount} 条`,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('AI批量打标执行失败:', error);
    return NextResponse.json(
      { success: false, message: `AI批量打标执行失败: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
