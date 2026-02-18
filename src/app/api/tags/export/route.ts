import { NextRequest, NextResponse } from 'next/server';
import { TagApplication, Tag, DataObject, sequelize } from '@/lib/database/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tagIds,
      logic = 'AND',
      dataObjectId,
      source,
      appliedBy,
      appliedAtFrom,
      appliedAtTo,
      exportFormat = 'csv',
      fields = ['dataObjectName', 'recordId', 'tagNames', 'appliedBy', 'appliedAt', 'source'],
    } = body;

    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return NextResponse.json(
        { success: false, message: '缺少标签ID列表' },
        { status: 400 }
      );
    }

    const tagIdPlaceholders = tagIds.map(() => '?').join(', ');
    
    let baseWhereClause = `
      WHERE ta.status = 'active'
      AND ta.tag_id IN (${tagIdPlaceholders})
    `;

    if (dataObjectId) {
      baseWhereClause += ` AND ta.data_object_id = ${dataObjectId}`;
    }
    if (source) {
      baseWhereClause += ` AND ta.source = '${source}'`;
    }
    if (appliedBy) {
      baseWhereClause += ` AND ta.applied_by = ${appliedBy}`;
    }
    if (appliedAtFrom) {
      baseWhereClause += ` AND ta.applied_at >= '${appliedAtFrom}'`;
    }
    if (appliedAtTo) {
      baseWhereClause += ` AND ta.applied_at <= '${appliedAtTo}'`;
    }

    const { QueryTypes } = require('sequelize');

    let query;
    let replacements = tagIds;

    if (logic === 'AND') {
      query = `
        SELECT 
          ta.id,
          ta.tag_id,
          ta.data_object_id,
          ta.record_id,
          ta.applied_by,
          ta.applied_at,
          ta.source,
          t.name as tag_name,
          t.code as tag_code,
          t.color as tag_color,
          do.name as data_object_name
        FROM tagfactory_tag_applications ta
        INNER JOIN tagfactory_tags t ON ta.tag_id = t.id
        LEFT JOIN tagfactory_data_objects do ON ta.data_object_id = do.id
        ${baseWhereClause}
        ORDER BY ta.applied_at DESC
      `;
    } else {
      query = `
        SELECT 
          ta.id,
          ta.tag_id,
          ta.data_object_id,
          ta.record_id,
          ta.applied_by,
          ta.applied_at,
          ta.source,
          t.name as tag_name,
          t.code as tag_code,
          t.color as tag_color,
          do.name as data_object_name
        FROM tagfactory_tag_applications ta
        INNER JOIN tagfactory_tags t ON ta.tag_id = t.id
        LEFT JOIN tagfactory_data_objects do ON ta.data_object_id = do.id
        ${baseWhereClause}
        ORDER BY ta.applied_at DESC
      `;
    }

    const results = await sequelize.query(query, {
      type: QueryTypes.SELECT,
      replacements,
    }) as any[];

    const groupedResults = new Map();
    results.forEach((row: any) => {
      const key = `${row.data_object_id}-${row.record_id || 'object'}`;
      if (!groupedResults.has(key)) {
        groupedResults.set(key, {
          dataObjectId: row.data_object_id,
          dataObjectName: row.data_object_name,
          recordId: row.record_id,
          tags: [],
          appliedBy: row.applied_by,
          appliedAt: row.applied_at,
          source: row.source,
        });
      }
      groupedResults.get(key).tags.push({
        name: row.tag_name,
        code: row.tag_code,
        color: row.tag_color,
      });
    });

    const exportData = Array.from(groupedResults.values()).map((item: any) => {
      const row: any = {};
      
      if (fields.includes('dataObjectName')) {
        row['数据对象'] = item.dataObjectName || '';
      }
      if (fields.includes('recordId')) {
        row['记录ID'] = item.recordId || '（对象级）';
      }
      if (fields.includes('tagNames')) {
        row['标签'] = item.tags.map((t: any) => t.name).join(', ');
      }
      if (fields.includes('appliedBy')) {
        row['应用人ID'] = item.appliedBy || '';
      }
      if (fields.includes('appliedAt')) {
        row['应用时间'] = item.appliedAt ? new Date(item.appliedAt).toLocaleString('zh-CN') : '';
      }
      if (fields.includes('source')) {
        const sourceMap: Record<string, string> = {
          manual: '手动',
          auto: '自动',
          import: '导入',
        };
        row['来源'] = sourceMap[item.source] || item.source || '';
      }
      
      return row;
    });

    if (exportFormat === 'csv') {
      const csv = await generateCSV(exportData);
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="tag-export-${Date.now()}.csv"`,
        },
      });

    } else if (exportFormat === 'excel') {
      const xlsx = await generateExcel(exportData);
      
      return new NextResponse(xlsx as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="tag-export-${Date.now()}.xlsx"`,
        },
      });

    } else {
      return NextResponse.json({
        success: true,
        data: {
          count: exportData.length,
          preview: exportData.slice(0, 10),
        },
      });
    }
  } catch (error) {
    console.error('导出失败:', error);
    return NextResponse.json(
      { success: false, message: '导出失败' },
      { status: 500 }
    );
  }
}

async function generateCSV(data: any[]): Promise<string> {
  if (data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const lines: string[] = [];

  const escapeField = (field: any): string => {
    const str = String(field || '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  lines.push(headers.map(escapeField).join(','));

  for (const row of data) {
    const values = headers.map((h) => escapeField(row[h]));
    lines.push(values.join(','));
  }

  const { stringify } = await import('csv-stringify/sync');
  return stringify(data, { header: true });
}

async function generateExcel(data: any[]): Promise<Buffer> {
  const XLSX = await import('xlsx');
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '标签导出');

  const excelBuffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });

  return Buffer.from(excelBuffer);
}
