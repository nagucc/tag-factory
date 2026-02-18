import { NextRequest, NextResponse } from 'next/server';
import { TagApplication, Tag, DataObject, sequelize } from '@/lib/database/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const dataObjectId = searchParams.get('dataObjectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'tag';

    if (!type) {
      return NextResponse.json(
        { success: false, message: '缺少统计类型参数' },
        { status: 400 }
      );
    }

    const { QueryTypes } = require('sequelize');

    switch (type) {
      case 'usage': {
        let query = '';
        const replacements: any[] = [];

        if (groupBy === 'tag') {
          query = `
            SELECT 
              t.id as tag_id,
              t.name as tag_name,
              t.code as tag_code,
              t.type as tag_type,
              t.color as tag_color,
              COUNT(ta.id) as application_count
            FROM tagfactory_tags t
            LEFT JOIN tagfactory_tag_applications ta ON t.id = ta.tag_id AND ta.status = 'active'
            ${startDate ? ` AND ta.applied_at >= '${startDate}'` : ''}
            ${endDate ? ` AND ta.applied_at <= '${endDate}'` : ''}
            ${dataObjectId ? ` AND ta.data_object_id = ${dataObjectId}` : ' AND ta.data_object_id IS NOT NULL'}
            WHERE t.status = 1
            GROUP BY t.id, t.name, t.code, t.type, t.color
            ORDER BY application_count DESC
          `;
        } else if (groupBy === 'type') {
          query = `
            SELECT 
              t.type as group_value,
              COUNT(ta.id) as application_count,
              COUNT(DISTINCT t.id) as tag_count
            FROM tagfactory_tags t
            LEFT JOIN tagfactory_tag_applications ta ON t.id = ta.tag_id AND ta.status = 'active'
            ${startDate ? ` AND ta.applied_at >= '${startDate}'` : ''}
            ${endDate ? ` AND ta.applied_at <= '${endDate}'` : ''}
            ${dataObjectId ? ` AND ta.data_object_id = ${dataObjectId}` : ' AND ta.data_object_id IS NOT NULL'}
            WHERE t.status = 1
            GROUP BY t.type
            ORDER BY application_count DESC
          `;
        } else if (groupBy === 'source') {
          query = `
            SELECT 
              ta.source as group_value,
              COUNT(ta.id) as application_count
            FROM tagfactory_tag_applications ta
            WHERE ta.status = 'active'
            ${startDate ? ` AND ta.applied_at >= '${startDate}'` : ''}
            ${endDate ? ` AND ta.applied_at <= '${endDate}'` : ''}
            ${dataObjectId ? ` AND ta.data_object_id = ${dataObjectId}` : ''}
            GROUP BY ta.source
            ORDER BY application_count DESC
          `;
        } else if (groupBy === 'dataObject') {
          query = `
            SELECT 
              do.id as data_object_id,
              do.name as data_object_name,
              COUNT(DISTINCT ta.tag_id) as tagged_tag_count,
              COUNT(ta.id) as application_count
            FROM tagfactory_data_objects do
            LEFT JOIN tagfactory_tag_applications ta ON do.id = ta.data_object_id AND ta.status = 'active'
            ${startDate ? ` AND ta.applied_at >= '${startDate}'` : ''}
            ${endDate ? ` AND ta.applied_at <= '${endDate}'` : ''}
            GROUP BY do.id, do.name
            ORDER BY application_count DESC
          `;
        }

        const results = await sequelize.query(query, {
          type: QueryTypes.SELECT,
          replacements,
        });

        const totalQuery = `
          SELECT COUNT(id) as total_count
          FROM tagfactory_tag_applications
          WHERE status = 'active'
          ${startDate ? ` AND applied_at >= '${startDate}'` : ''}
          ${endDate ? ` AND applied_at <= '${endDate}'` : ''}
          ${dataObjectId ? ` AND data_object_id = ${dataObjectId}` : ''}
        `;

        const totalResult = await sequelize.query(totalQuery, {
          type: QueryTypes.SELECT,
        }) as any[];

        return NextResponse.json({
          success: true,
          data: {
            type: 'usage',
            groupBy,
            results,
            totalApplications: totalResult[0]?.total_count || 0,
            period: { startDate, endDate },
          },
        });
      }

      case 'distribution': {
        let query = '';
        
        if (groupBy === 'tag') {
          query = `
            SELECT 
              t.id as tag_id,
              t.name as tag_name,
              t.type as tag_type,
              t.color as tag_color,
              COUNT(ta.id) as count,
              ROUND(
                COUNT(ta.id) * 100.0 / NULLIF(
                  (SELECT COUNT(id) FROM tagfactory_tag_applications WHERE status = 'active'
                   ${startDate ? ` AND applied_at >= '${startDate}'` : ''}
                   ${endDate ? ` AND applied_at <= '${endDate}'` : ''}
                   ${dataObjectId ? ` AND data_object_id = ${dataObjectId}` : ''}),
                  0
                ), 2
              ) as percentage
            FROM tagfactory_tags t
            LEFT JOIN tagfactory_tag_applications ta ON t.id = ta.tag_id AND ta.status = 'active'
            ${startDate ? ` AND ta.applied_at >= '${startDate}'` : ''}
            ${endDate ? ` AND ta.applied_at <= '${endDate}'` : ''}
            ${dataObjectId ? ` AND ta.data_object_id = ${dataObjectId}` : ''}
            WHERE t.status = 1
            GROUP BY t.id, t.name, t.type, t.color
            HAVING COUNT(ta.id) > 0
            ORDER BY count DESC
            LIMIT 20
          `;
        } else if (groupBy === 'type') {
          query = `
            SELECT 
              t.type as label,
              COUNT(ta.id) as value,
              ROUND(
                COUNT(ta.id) * 100.0 / NULLIF(
                  (SELECT COUNT(id) FROM tagfactory_tag_applications WHERE status = 'active'
                   ${startDate ? ` AND applied_at >= '${startDate}'` : ''}
                   ${endDate ? ` AND applied_at <= '${endDate}'` : ''}
                   ${dataObjectId ? ` AND data_object_id = ${dataObjectId}` : ''}),
                  0
                ), 2
              ) as percentage
            FROM tagfactory_tags t
            LEFT JOIN tagfactory_tag_applications ta ON t.id = ta.tag_id AND ta.status = 'active'
            ${startDate ? ` AND ta.applied_at >= '${startDate}'` : ''}
            ${endDate ? ` AND ta.applied_at <= '${endDate}'` : ''}
            ${dataObjectId ? ` AND ta.data_object_id = ${dataObjectId}` : ''}
            WHERE t.status = 1
            GROUP BY t.type
            ORDER BY value DESC
          `;
        } else if (groupBy === 'dataObject') {
          query = `
            SELECT 
              do.id as data_object_id,
              do.name as data_object_name,
              COUNT(DISTINCT ta.tag_id) as tag_count,
              COUNT(ta.id) as application_count,
              ROUND(
                COUNT(ta.id) * 100.0 / NULLIF(
                  (SELECT COUNT(id) FROM tagfactory_tag_applications WHERE status = 'active'
                   ${startDate ? ` AND applied_at >= '${startDate}'` : ''}
                   ${endDate ? ` AND applied_at <= '${endDate}'` : ''}),
                  0
                ), 2
              ) as percentage
            FROM tagfactory_data_objects do
            LEFT JOIN tagfactory_tag_applications ta ON do.id = ta.data_object_id AND ta.status = 'active'
            ${startDate ? ` AND ta.applied_at >= '${startDate}'` : ''}
            ${endDate ? ` AND ta.applied_at <= '${endDate}'` : ''}
            GROUP BY do.id, do.name
            HAVING COUNT(ta.id) > 0
            ORDER BY application_count DESC
          `;
        }

        const results = await sequelize.query(query, { type: QueryTypes.SELECT });

        return NextResponse.json({
          success: true,
          data: {
            type: 'distribution',
            groupBy,
            results,
            period: { startDate, endDate },
          },
        });
      }

      case 'trends': {
        const period = searchParams.get('period') || '7days';
        let dateFormat = '%Y-%m-%d';
        let dateSubtract = 7;

        if (period === '30days') {
          dateSubtract = 30;
        } else if (period === '90days') {
          dateSubtract = 90;
        } else if (period === '12months') {
          dateFormat = '%Y-%m';
          dateSubtract = 12;
        }

        const query = `
          SELECT 
            DATE(ta.applied_at) as date_label,
            t.type as tag_type,
            COUNT(ta.id) as application_count,
            COUNT(DISTINCT ta.tag_id) as tag_count
          FROM tagfactory_tag_applications ta
          LEFT JOIN tagfactory_tags t ON ta.tag_id = t.id
          WHERE ta.status = 'active'
          AND ta.applied_at >= DATE_SUB(CURDATE(), INTERVAL ${dateSubtract} DAY)
          ${dataObjectId ? ` AND ta.data_object_id = ${dataObjectId}` : ''}
          GROUP BY DATE(ta.applied_at), t.type
          ORDER BY date_label ASC
        `;

        const results = await sequelize.query(query, { type: QueryTypes.SELECT });

        const summaryQuery = `
          SELECT 
            COUNT(id) as total_applications,
            COUNT(DISTINCT tag_id) as total_tags,
            COUNT(DISTINCT data_object_id) as total_data_objects,
            MIN(applied_at) as first_application,
            MAX(applied_at) as latest_application
          FROM tagfactory_tag_applications
          WHERE status = 'active'
          AND applied_at >= DATE_SUB(CURDATE(), INTERVAL ${dateSubtract} DAY)
          ${dataObjectId ? ` AND data_object_id = ${dataObjectId}` : ''}
        `;

        const summary = await sequelize.query(summaryQuery, { type: QueryTypes.SELECT }) as any[];

        return NextResponse.json({
          success: true,
          data: {
            type: 'trends',
            period,
            results,
            summary: summary[0] || {},
          },
        });
      }

      case 'cooccurrence': {
        const minCooccurrence = parseInt(searchParams.get('minCooccurrence') || '2');

        const query = `
          SELECT 
            ta1.tag_id as tag1_id,
            t1.name as tag1_name,
            t1.color as tag1_color,
            ta2.tag_id as tag2_id,
            t2.name as tag2_name,
            t2.color as tag2_color,
            COUNT(*) as cooccurrence_count
          FROM tagfactory_tag_applications ta1
          INNER JOIN tagfactory_tag_applications ta2 
            ON ta1.data_object_id = ta2.data_object_id 
            AND ta1.record_id = ta2.record_id
            AND ta1.status = 'active'
            AND ta2.status = 'active'
            AND ta1.tag_id < ta2.tag_id
          INNER JOIN tagfactory_tags t1 ON ta1.tag_id = t1.id
          INNER JOIN tagfactory_tags t2 ON ta2.tag_id = t2.id
          ${dataObjectId ? ` AND ta1.data_object_id = ${dataObjectId}` : ''}
          GROUP BY ta1.tag_id, ta2.tag_id, t1.name, t2.name, t1.color, t2.color
          HAVING COUNT(*) >= ${minCooccurrence}
          ORDER BY cooccurrence_count DESC
          LIMIT 50
        `;

        const results = await sequelize.query(query, { type: QueryTypes.SELECT });

        const tagsCooccurrenceQuery = `
          SELECT 
            tag_id,
            COUNT(*) as total_applications,
            COUNT(DISTINCT data_object_id || '-' || COALESCE(record_id, 'object')) as unique_records
          FROM tagfactory_tag_applications
          WHERE status = 'active'
          GROUP BY tag_id
          ORDER BY total_applications DESC
        `;

        const tagStats = await sequelize.query(tagsCooccurrenceQuery, { type: QueryTypes.SELECT });

        return NextResponse.json({
          success: true,
          data: {
            type: 'cooccurrence',
            minCooccurrence,
            results,
            tagStats,
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, message: '不支持的统计类型' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('标签统计分析失败:', error);
    return NextResponse.json(
      { success: false, message: '标签统计分析失败' },
      { status: 500 }
    );
  }
}
