import { NextRequest, NextResponse } from 'next/server';
import { DataObject, DataSource, DataRecord, TagApplication, Tag } from '@/lib/database/models';
import { Op, WhereOptions, IncludeOptions, FindAndCountOptions } from 'sequelize';
import sequelize from '@/lib/database/mysql';
import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { Model } from 'sequelize';

interface DataObjectAttributes {
  id: number;
  name: string;
  description?: string;
  data_source_id: number;
  query_statement: string;
  primary_key: string;
  display_template: string;
  sync_enabled: boolean;
  sync_cron?: string;
  sync_strategy: string;
  last_sync_at?: Date;
  last_sync_status?: string;
  sync_count: number;
  status: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

interface DataSourceAttributes {
  id: number;
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

interface DataRecordAttributes {
  id: number;
  data_object_id: number;
  record_id: string;
  data: Record<string, unknown>;
  _synced_at: Date;
  _sync_status: string;
}

interface DataRecordInstance extends Model<DataRecordAttributes>, DataRecordAttributes {}

interface DataObjectInstance extends Model<DataObjectAttributes>, DataObjectAttributes {
  dataSource?: DataSourceAttributes;
}

interface TagAttributes {
  id: number;
  name: string;
  color: string;
}

interface TagApplicationAttributes {
  id: number;
  tag_id: number;
  data_object_id: number;
  record_id: string;
  applied_by: number;
  applied_at: Date;
  source: string;
  status: string;
}

interface TagApplicationInstance extends Model<TagApplicationAttributes>, TagApplicationAttributes {
  tag?: TagAttributes;
}

interface RecordItem {
  id: number;
  record_id: string;
  data: Record<string, unknown>;
  tags: Array<{ id: number; name: string; color: string }>;
  _synced_at: Date;
  _sync_status: string;
}

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const sortField = searchParams.get('sortField') || '_synced_at';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';

    const dataObject = await DataObject.findByPk(numericId) as DataObjectInstance | null;
    if (!dataObject) {
      return NextResponse.json(
        { success: false, message: '数据对象不存在' },
        { status: 404 }
      );
    }

    const options: FindAndCountOptions<DataRecordAttributes> = {
      where: {
        data_object_id: numericId,
        _sync_status: 'active',
      },
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [[sortField, sortOrder]],
    };

    const result = await DataRecord.findAndCountAll(options) as { count: number; rows: DataRecordInstance[] };

    const recordIds = result.rows.map((r) => r.record_id);
    let tagApplications: TagApplicationInstance[] = [];

    if (recordIds.length > 0) {
      const where: WhereOptions<TagApplicationAttributes> = {
        data_object_id: numericId,
        record_id: { [Op.in]: recordIds },
        status: 'active',
      };

      const include: IncludeOptions[] = [
        {
          model: Tag,
          as: 'tag',
          attributes: ['id', 'name', 'color'],
        },
      ];

      tagApplications = await TagApplication.findAll({ where, include }) as TagApplicationInstance[];
    }

    interface TagInfo {
      id: number;
      name: string;
      color: string;
    }

    const tagMap = new Map<string, TagInfo[]>();
    tagApplications.forEach((ta) => {
      const key = ta.record_id;
      if (!tagMap.has(key)) {
        tagMap.set(key, []);
      }
      if (ta.tag) {
        tagMap.get(key)?.push({
          id: ta.tag.id,
          name: ta.tag.name,
          color: ta.tag.color,
        });
      }
    });

    const records: RecordItem[] = result.rows.map((record) => ({
      id: record.id,
      record_id: record.record_id,
      data: record.data,
      tags: tagMap.get(record.record_id) || [],
      _synced_at: record._synced_at,
      _sync_status: record._sync_status,
    }));

    return NextResponse.json({
      success: true,
      data: {
        display_template: dataObject.display_template,
        primary_key: dataObject.primary_key,
        list: records,
        pagination: {
          page,
          pageSize,
          total: result.count,
          totalPages: Math.ceil(result.count / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取数据记录列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取数据记录列表失败' },
      { status: 500 }
    );
  }
}

interface SyncRequestBody {
  syncStrategy?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const transaction = await sequelize.transaction();
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);
    const body: SyncRequestBody = await request.json();
    const syncStrategy = body.syncStrategy || 'full';

    const dataObject = await DataObject.findByPk(numericId, {
      include: [
        {
          model: DataSource,
          as: 'dataSource',
        },
      ],
    }) as DataObjectInstance | null;

    if (!dataObject) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '数据对象不存在' },
        { status: 404 }
      );
    }

    const dsAttributes = dataObject.dataSource as DataSourceAttributes | undefined;
    if (!dsAttributes) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '数据源信息不存在' },
        { status: 400 }
      );
    }

    await DataObject.update(
      { last_sync_status: 'running', last_sync_at: new Date() },
      { where: { id: numericId }, transaction }
    );

    let sourceData: Record<string, unknown>[] = [];

    try {
      if (dsAttributes.type === 'mysql') {
        const connection = await mysql.createConnection({
          host: dsAttributes.host,
          port: dsAttributes.port,
          user: dsAttributes.username,
          password: dsAttributes.password,
          database: dsAttributes.database,
        });

        const [rows] = await connection.query(dataObject.query_statement);
        sourceData = rows as Record<string, unknown>[];
        await connection.end();
      } else if (dsAttributes.type === 'mongodb') {
        const mongoUri = `mongodb://${dsAttributes.username}:${dsAttributes.password}@${dsAttributes.host}:${dsAttributes.port}/${dsAttributes.database}?authSource=admin`;

        await mongoose.connect(mongoUri);
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection failed');

        const queryStatement = dataObject.query_statement;
        const collectionName = queryStatement.split('.')[1]?.split(/[()\s]/)[0] || 'collection';
        const collection = db.collection(collectionName);

        const cursor = collection.find({});
        sourceData = await cursor.toArray();
        await mongoose.disconnect();
      }
    } catch (sourceError) {
      console.error('数据源连接失败:', sourceError);
      await DataObject.update(
        { last_sync_status: 'failed' },
        { where: { id: numericId }, transaction }
      );
      await transaction.rollback();
      return NextResponse.json(
        {
          success: false,
          message: `数据源连接失败: ${sourceError instanceof Error ? sourceError.message : '未知错误'}`,
        },
        { status: 500 }
      );
    }

    const primaryKey = dataObject.primary_key;
    const existingRecords = await DataRecord.findAll({
      where: {
        data_object_id: numericId,
        _sync_status: 'active',
      },
      attributes: ['record_id'],
      transaction,
    }) as DataRecordInstance[];

    const existingRecordIds = new Set(existingRecords.map((r) => r.record_id));
    const sourceRecordIds = new Set(sourceData.map((r) => String(r[primaryKey])));

    let syncCount = 0;
    let newCount = 0;
    let updateCount = 0;

    for (const record of sourceData) {
      const recordId = String(record[primaryKey]);
      syncCount++;

      if (existingRecordIds.has(recordId)) {
        await DataRecord.update(
          {
            data: record,
            _synced_at: new Date(),
          },
          {
            where: { data_object_id: numericId, record_id: recordId },
            transaction,
          }
        );
        updateCount++;
      } else {
        await DataRecord.create(
          {
            data_object_id: numericId,
            record_id: recordId,
            data: record,
            _synced_at: new Date(),
            _sync_status: 'active',
          },
          { transaction }
        );
        newCount++;
      }
    }

    if (syncStrategy === 'full') {
      const recordsToRemove = Array.from(existingRecordIds).filter(
        (recId) => !sourceRecordIds.has(recId as string)
      );

      if (recordsToRemove.length > 0) {
        await DataRecord.update(
          { _sync_status: 'removed' },
          {
            where: {
              data_object_id: numericId,
              record_id: { [Op.in]: recordsToRemove },
            },
            transaction,
          }
        );
      }
    }

    await DataObject.update(
      {
        last_sync_status: 'success',
        last_sync_at: new Date(),
        sync_count: syncCount,
      },
      { where: { id: numericId }, transaction }
    );

    await transaction.commit();

    return NextResponse.json({
      success: true,
      message: '同步成功',
      data: {
        total: sourceData.length,
        new: newCount,
        updated: updateCount,
        synced_at: new Date(),
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('数据同步失败:', error);

    try {
      const { id } = await params;
      await DataObject.update(
        { last_sync_status: 'failed' },
        { where: { id: parseInt(id, 10) } }
      );
    } catch (updateError) {
      console.error('更新同步状态失败:', updateError);
    }

    return NextResponse.json(
      {
        success: false,
        message: `数据同步失败: ${error instanceof Error ? error.message : '未知错误'}`,
      },
      { status: 500 }
    );
  }
}
