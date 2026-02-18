import { NextRequest, NextResponse } from 'next/server';
import { TagApplication, Tag, DataObject, DataRecord, User, sequelize } from '@/lib/database/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tagIds,
      logic = 'AND',
      dataObjectId,
      recordId,
      source,
      appliedBy,
      appliedAtFrom,
      appliedAtTo,
      page = 1,
      pageSize = 20,
    } = body;

    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return NextResponse.json(
        { success: false, message: '缺少标签ID列表' },
        { status: 400 }
      );
    }

    const whereClause: any = {
      status: 'active',
    };

    if (dataObjectId) {
      whereClause.data_object_id = dataObjectId;
    }

    if (recordId) {
      whereClause.record_id = recordId;
    }

    if (source) {
      whereClause.source = source;
    }

    if (appliedBy) {
      whereClause.applied_by = appliedBy;
    }

    if (appliedAtFrom || appliedAtTo) {
      whereClause.applied_at = {};
      if (appliedAtFrom) {
        whereClause.applied_at[Symbol.for('sequelize.op')] = '>=';
        whereClause.applied_at.value = appliedAtFrom;
      }
      if (appliedAtTo) {
        whereClause.applied_at[Symbol.for('sequelize.op')] = '<=';
        whereClause.applied_at.value = appliedAtTo;
      }
    }

    const { Op } = require('sequelize');

    let tagApplications: any[] = [];
    let totalRecords = 0;

    if (logic === 'AND') {
      const { QueryTypes } = require('sequelize');
      
      const tagIdPlaceholders = tagIds.map(() => '?').join(', ');
      
      const countQuery = `
        SELECT COUNT(DISTINCT ta.data_object_id, ta.record_id) as total
        FROM tagfactory_tag_applications ta
        WHERE ta.status = 'active'
        AND ta.tag_id IN (${tagIdPlaceholders})
        ${dataObjectId ? ` AND ta.data_object_id = ${dataObjectId}` : ''}
        ${recordId ? ` AND ta.record_id = '${recordId}'` : ''}
        ${source ? ` AND ta.source = '${source}'` : ''}
        ${appliedBy ? ` AND ta.applied_by = ${appliedBy}` : ''}
        ${appliedAtFrom ? ` AND ta.applied_at >= '${appliedAtFrom}'` : ''}
        ${appliedAtTo ? ` AND ta.applied_at <= '${appliedAtTo}'` : ''}
      `;

      const countResult = await sequelize.query(countQuery, {
        replacements: tagIds,
        type: QueryTypes.SELECT,
      }) as any[];

      totalRecords = countResult[0]?.total || 0;

      const query = `
        SELECT 
          ta.id, ta.tag_id, ta.data_object_id, ta.record_id, 
          ta.applied_by, ta.applied_at, ta.source,
          t.name as tag_name, t.color as tag_color,
          do.name as data_object_name,
          u.username as applier_name
        FROM tagfactory_tag_applications ta
        INNER JOIN tagfactory_tags t ON ta.tag_id = t.id
        LEFT JOIN tagfactory_data_objects do ON ta.data_object_id = do.id
        LEFT JOIN tagfactory_users u ON ta.applied_by = u.id
        WHERE ta.status = 'active'
        AND ta.tag_id IN (${tagIdPlaceholders})
        ${dataObjectId ? ` AND ta.data_object_id = ${dataObjectId}` : ''}
        ${recordId ? ` AND ta.record_id = '${recordId}'` : ''}
        ${source ? ` AND ta.source = '${source}'` : ''}
        ${appliedBy ? ` AND ta.applied_by = ${appliedBy}` : ''}
        ${appliedAtFrom ? ` AND ta.applied_at >= '${appliedAtFrom}'` : ''}
        ${appliedAtTo ? ` AND ta.applied_at <= '${appliedAtTo}'` : ''}
        ORDER BY ta.applied_at DESC
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
      `;

      tagApplications = await sequelize.query(query, {
        replacements: tagIds,
        type: QueryTypes.SELECT,
      });

      const uniqueRecords = new Map();
      tagApplications.forEach((item: any) => {
        const key = `${item.data_object_id}-${item.record_id || 'object'}`;
        if (!uniqueRecords.has(key)) {
          const recordTags = tagApplications.filter(
            (t: any) => `${t.data_object_id}-${t.record_id || 'object'}` === key
          );
          uniqueRecords.set(key, {
            dataObjectId: item.data_object_id,
            dataObjectName: item.data_object_name,
            recordId: item.record_id,
            tags: recordTags.map((t: any) => ({
              id: t.tag_id,
              name: t.tag_name,
              color: t.tag_color,
            })),
            appliedBy: item.applied_by,
            applierName: item.applier_name,
            appliedAt: item.applied_at,
            source: item.source,
          });
        }
      });

      const records = Array.from(uniqueRecords.values());
      const start = (page - 1) * pageSize;
      const paginatedRecords = records.slice(start, start + pageSize);

      return NextResponse.json({
        success: true,
        data: {
          list: paginatedRecords,
          pagination: {
            page,
            pageSize,
            total: records.length,
            totalPages: Math.ceil(records.length / pageSize),
          },
          matchedTagCount: tagIds.length,
        },
      });

    } else {
      whereClause.tag_id = { [Op.in]: tagIds };

      const { count, rows } = await TagApplication.findAndCountAll({
        where: whereClause,
        include: [
          { model: Tag, as: 'tag', attributes: ['id', 'name', 'color'] },
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
          matchedTagCount: tagIds.length,
        },
      });
    }
  } catch (error) {
    console.error('标签查询失败:', error);
    return NextResponse.json(
      { success: false, message: '标签查询失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tagId');
    const dataObjectId = searchParams.get('dataObjectId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    if (!tagId) {
      return NextResponse.json(
        { success: false, message: '缺少标签ID' },
        { status: 400 }
      );
    }

    const where: any = {
      tag_id: parseInt(tagId),
      status: 'active',
    };

    if (dataObjectId) {
      where.data_object_id = parseInt(dataObjectId);
    }

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
