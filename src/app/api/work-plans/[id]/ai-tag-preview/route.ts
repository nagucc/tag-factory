import { NextRequest, NextResponse } from 'next/server';
import { WorkPlan, WorkPlanRecord, WorkPlanTag, Tag, DataRecord } from '@/lib/database/models';
import { generateTagRecommendations, isAIConfigured } from '@/lib/services/openai';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAIConfigured()) {
      return NextResponse.json(
        { success: false, message: 'AI功能未配置，请设置 OPENAI_API_KEY 环境变量' },
        { status: 400 }
      );
    }

    const { id: workPlanId } = await params;
    const body = await request.json();
    const { prompt, record_ids, page_size = 50 } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, message: '请输入打标提示词' },
        { status: 400 }
      );
    }

    const validatedPageSize = Math.min(Math.max(parseInt(page_size) || 50, 10), 100);

    const workPlan = await WorkPlan.findByPk(workPlanId);
    if (!workPlan) {
      return NextResponse.json(
        { success: false, message: '工作计划不存在' },
        { status: 404 }
      );
    }

    const workPlanData = workPlan.toJSON() as any;
    if (workPlanData.status !== 'active') {
      return NextResponse.json(
        { success: false, message: '工作计划已结束，无法进行打标' },
        { status: 400 }
      );
    }

    const workPlanTags = await WorkPlanTag.findAll({
      where: { work_plan_id: workPlanId },
    });

    if (workPlanTags.length === 0) {
      return NextResponse.json(
        { success: false, message: '工作计划没有可用标签' },
        { status: 400 }
      );
    }

    const tagIds = workPlanTags.map(wt => (wt as any).tag_id);
    const availableTags = await Tag.findAll({
      where: { id: tagIds },
    });

    const availableTagsData = availableTags.map(t => t.toJSON()) as any[];

    const whereClause: any = { work_plan_id: workPlanId, status: 'pending' };
    if (record_ids && record_ids.length > 0) {
      whereClause.record_id = { $in: record_ids };
    }

    const records = await WorkPlanRecord.findAll({
      where: whereClause,
      limit: 100,
    });

    if (records.length === 0) {
      return NextResponse.json(
        { success: false, message: '没有待打标的记录' },
        { status: 400 }
      );
    }

    const dataObjectId = workPlanData.data_object_id;

    const recordDataPromises = records.map(async (wpr) => {
      const wprData = wpr.toJSON() as any;
      const originalRecord = await DataRecord.findOne({
        where: { data_object_id: dataObjectId, record_id: wprData.record_id },
      });
      return {
        record_id: wprData.record_id,
        data: originalRecord?.toJSON()?.data || {},
      };
    });

    const recordsWithData = await Promise.all(recordDataPromises);

    const allRecommendations: any[] = [];
    const batches = [];
    for (let i = 0; i < recordsWithData.length; i += validatedPageSize) {
      batches.push(recordsWithData.slice(i, i + validatedPageSize));
    }

    for (const batch of batches) {
      try {
        const recommendations = await generateTagRecommendations(
          batch,
          prompt,
          availableTagsData.map(t => ({
            id: t.id,
            name: t.name,
            code: t.code,
            color: t.color,
          }))
        );
        allRecommendations.push(...recommendations);
      } catch (error) {
        console.error('Batch AI recommendation error:', error);
        return NextResponse.json(
          { success: false, message: `AI处理批次数据失败: ${(error as Error).message}` },
          { status: 500 }
        );
      }
    }

    const recommendationsWithTagInfo = allRecommendations.map(rec => {
      const tag = availableTagsData.find(t => t.id === rec.tag_id);
      return {
        ...rec,
        tag_color: tag?.color || null,
      };
    });

    const tagDistribution: Record<number, number> = {};
    recommendationsWithTagInfo.forEach(rec => {
      if (rec.tag_id) {
        tagDistribution[rec.tag_id] = (tagDistribution[rec.tag_id] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        total: records.length,
        page_size: validatedPageSize,
        batches: batches.length,
        recommendations: recommendationsWithTagInfo,
        tag_distribution: tagDistribution,
        available_tags: availableTagsData.map(t => ({
          id: t.id,
          name: t.name,
          color: t.color,
        })),
      },
    });
  } catch (error) {
    console.error('AI打标预览失败:', error);
    return NextResponse.json(
      { success: false, message: `AI打标预览失败: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
