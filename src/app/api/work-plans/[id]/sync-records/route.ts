import { NextRequest, NextResponse } from 'next/server';
import { WorkPlan, DataRecord, WorkPlanRecord } from '@/lib/database/models';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { syncStrategy = 'full' } = body;

    const workPlan = await WorkPlan.findByPk(id);

    if (!workPlan) {
      return NextResponse.json(
        { success: false, message: '工作计划不存在' },
        { status: 404 }
      );
    }

    const workPlanData = workPlan.toJSON() as any;
    const dataObjectId = workPlanData.data_object_id;

    let whereClause: any = { data_object_id: dataObjectId, _sync_status: 'active' };
    
    if (syncStrategy === 'incremental') {
      const lastSync = await WorkPlanRecord.findOne({
        where: { work_plan_id: id },
        order: [['created_at', 'DESC']],
      });
      
      if (lastSync) {
        const lastSyncData = lastSync.toJSON() as any;
        const { Op } = require('sequelize');
        whereClause._synced_at = { [Op.gt]: lastSyncData.created_at };
      }
    }

    const records = await DataRecord.findAll({ where: whereClause });

    let newCount = 0;
    let existingCount = 0;

    for (const record of records) {
      const recordData = record.toJSON() as any;
      
      const [_, built] = await WorkPlanRecord.findOrCreate({
        where: {
          work_plan_id: id,
          record_id: recordData.record_id,
        },
        defaults: {
          work_plan_id: parseInt(id),
          record_id: recordData.record_id,
          status: 'pending',
        },
      });

      if (built) {
        newCount++;
      } else {
        existingCount++;
      }
    }

    const totalRecords = await WorkPlanRecord.count({ where: { work_plan_id: id } });
    const taggedRecords = await WorkPlanRecord.count({ 
      where: { work_plan_id: id, status: 'tagged' } 
    });
    const skippedRecords = await WorkPlanRecord.count({ 
      where: { work_plan_id: id, status: 'skipped' } 
    });
    const completedRecords = taggedRecords + skippedRecords;

    await workPlan.update({
      total_records: totalRecords,
      tagged_records: completedRecords,
    });

    return NextResponse.json({
      success: true,
      data: {
        total: records.length,
        new: newCount,
        updated: existingCount,
        totalRecords,
        completedRecords,
        taggedRecords,
        skippedRecords,
      },
      message: `同步成功：共${records.length}条记录，新增${newCount}条`,
    });
  } catch (error: any) {
    console.error('同步数据记录失败:', error.message);
    return NextResponse.json(
      { success: false, message: `同步数据记录失败: ${error.message}` },
      { status: 500 }
    );
  }
}
