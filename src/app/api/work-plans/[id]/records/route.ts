import { NextRequest, NextResponse } from 'next/server';
import { WorkPlan, WorkPlanRecord, DataRecord, Tag, User } from '@/lib/database/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: any = { work_plan_id: id };
    
    if (status === 'completed') {
      where.status = { $in: ['tagged', 'skipped'] };
    } else if (status) {
      where.status = status;
    }

    const { count, rows } = await WorkPlanRecord.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    const workPlan = await WorkPlan.findByPk(id);
    const workPlanData = workPlan?.toJSON() as any;
    const dataObjectId = workPlanData?.data_object_id;

    const recordsWithData = await Promise.all(
      rows.map(async (wpr) => {
        const recordData = wpr.toJSON() as any;
        const originalRecord = await DataRecord.findOne({
          where: { 
            data_object_id: dataObjectId,
            record_id: recordData.record_id 
          },
        });

        let tagInfo = null;
        if (recordData.tag_id) {
          tagInfo = await Tag.findByPk(recordData.tag_id);
        }

        let taggerInfo = null;
        if (recordData.tagged_by) {
          taggerInfo = await User.findByPk(recordData.tagged_by, {
            attributes: ['id', 'username'],
          });
        }

        return {
          ...recordData,
          data: originalRecord?.toJSON()?.data || {},
          tag: tagInfo?.toJSON(),
          tagger: taggerInfo?.toJSON(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        list: recordsWithData,
        pagination: {
          page,
          pageSize,
          total: count,
          totalPages: Math.ceil(count / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取工作计划记录失败:', error);
    return NextResponse.json(
      { success: false, message: '获取工作计划记录失败' },
      { status: 500 }
    );
  }
}
