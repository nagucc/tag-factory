import { NextRequest, NextResponse } from 'next/server';
import { TagApplication, Tag, DataObject, DataRecord, User } from '@/lib/database/models';
import sequelize from '@/lib/database/mysql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const dataObjectId = searchParams.get('dataObjectId');
    const recordId = searchParams.get('recordId');
    const tagId = searchParams.get('tagId');
    const status = searchParams.get('status') || 'active';

    const where: any = { status };
    if (dataObjectId) where.data_object_id = dataObjectId;
    if (recordId) where.record_id = recordId;
    if (tagId) where.tag_id = tagId;

    const { count, rows } = await TagApplication.findAndCountAll({
      where,
      include: [
        { model: Tag, as: 'tag', attributes: ['id', 'name', 'color', 'code'] },
        { model: DataObject, as: 'dataObject', attributes: ['id', 'name'] },
        { model: User, as: 'applier', attributes: ['id', 'username'] },
      ],
      order: [['applied_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        list: rows,
        pagination: {
          page,
          pageSize,
          total: count,
          totalPages: Math.ceil(count / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取标签应用列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取标签应用列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const transaction = await sequelize.transaction();
  
  try {
    const body = await request.json();
    const { tag_id, data_object_id, record_id, user_id } = body;

    if (!tag_id || !data_object_id) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '缺少必填字段' },
        { status: 400 }
      );
    }

    const tag = await Tag.findByPk(tag_id);
    if (!tag) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '标签不存在' },
        { status: 400 }
      );
    }

    const [existingApplication] = await TagApplication.findOrBuild({
      where: {
        tag_id,
        data_object_id,
        record_id: record_id || null,
      },
      transaction,
    });

    const existingData = existingApplication.toJSON() as any;
    if (existingData.status === 'active') {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '该标签已应用于此记录' },
        { status: 400 }
      );
    }

    await existingApplication.update({
      status: 'active',
      applied_by: user_id || 1,
      applied_at: new Date(),
      source: body.source || 'manual',
      removed_by: null,
      removed_at: null,
    }, { transaction });

    await transaction.commit();

    return NextResponse.json({
      success: true,
      data: existingApplication,
      message: '标签应用成功',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('应用标签失败:', error);
    return NextResponse.json(
      { success: false, message: '应用标签失败' },
      { status: 500 }
    );
  }
}
