import { NextRequest, NextResponse } from 'next/server';
import { TagApplication, Tag, DataObject, DataRecord } from '@/lib/database/models';
import sequelize from '@/lib/database/mysql';

export async function POST(request: NextRequest) {
  const transaction = await sequelize.transaction();
  
  try {
    const body = await request.json();
    const { tag_ids, records, data_object_id, user_id, source } = body;

    if (!tag_ids || !records || !data_object_id || tag_ids.length === 0 || records.length === 0) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '缺少必填字段' },
        { status: 400 }
      );
    }

    for (const tagId of tag_ids) {
      const tag = await Tag.findByPk(tagId);
      if (!tag) {
        await transaction.rollback();
        return NextResponse.json(
          { success: false, message: `标签ID ${tagId} 不存在` },
          { status: 400 }
        );
      }
    }

    const results = [];
    
    for (const record of records) {
      const recordId = record.record_id || record;
      
      for (const tagId of tag_ids) {
        const [application] = await TagApplication.findOrBuild({
          where: {
            tag_id: tagId,
            data_object_id,
            record_id: recordId,
          },
          transaction,
          defaults: {
            applied_by: user_id || 1,
            source: source || 'manual',
            status: 'active',
            applied_at: new Date(),
          },
        });

        const appData = application.toJSON() as any;
        if (appData.status === 'active') {
          continue;
        }

        await application.update({
          status: 'active',
          applied_by: user_id || 1,
          applied_at: new Date(),
          source: source || 'manual',
          removed_by: null,
          removed_at: null,
        }, { transaction });

        results.push({
          record_id: recordId,
          tag_id: tagId,
          success: true,
        });
      }
    }

    await transaction.commit();

    return NextResponse.json({
      success: true,
      data: {
        total: results.length,
        results,
      },
      message: `成功为 ${results.length} 条记录应用标签`,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('批量应用标签失败:', error);
    return NextResponse.json(
      { success: false, message: '批量应用标签失败' },
      { status: 500 }
    );
  }
}
