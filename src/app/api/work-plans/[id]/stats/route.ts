import { NextRequest, NextResponse } from 'next/server';
import { WorkPlan, WorkPlanRecord, DataRecord, DataObject } from '@/lib/database/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const workPlan = await WorkPlan.findByPk(id);

    if (!workPlan) {
      return NextResponse.json(
        { success: false, message: '工作计划不存在' },
        { status: 404 }
      );
    }

    const workPlanData = workPlan.toJSON() as any;
    
    const dataObject = await DataObject.findByPk(workPlanData.data_object_id);
    const dataObjectData = dataObject?.toJSON() as any;

    const [totalRecords, taggedCount, skippedCount] = await Promise.all([
      WorkPlanRecord.count({ where: { work_plan_id: id } }),
      WorkPlanRecord.count({ where: { work_plan_id: id, status: 'tagged' } }),
      WorkPlanRecord.count({ where: { work_plan_id: id, status: 'skipped' } }),
    ]);

    const completedCount = taggedCount + skippedCount;
    const progress = totalRecords > 0 ? Math.round((completedCount / totalRecords) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        id: workPlanData.id,
        name: workPlanData.name,
        description: workPlanData.description,
        data_object_id: workPlanData.data_object_id,
        status: workPlanData.status,
        display_template: dataObjectData?.display_template || '{{id}}',
        primary_key: dataObjectData?.primary_key || 'id',
        total_records: totalRecords,
        tagged_records: completedCount,
        progress,
        dataObject: dataObjectData,
      },
    });
  } catch (error) {
    console.error('获取工作计划统计失败:', error);
    return NextResponse.json(
      { success: false, message: '获取工作计划统计失败' },
      { status: 500 }
    );
  }
}
