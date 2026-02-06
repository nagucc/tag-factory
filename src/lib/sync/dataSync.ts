import { DataSource, DataObject, DataRecord } from '@/lib/database/models';
import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { QueryTypes, Op, Transaction } from 'sequelize';

export interface SyncResult {
  success: boolean;
  total: number;
  new: number;
  updated: number;
  removed: number;
  error?: string;
  syncedAt: Date;
}

export interface SyncOptions {
  strategy: 'full' | 'incremental';
  transaction?: Transaction;
}

class DataSyncService {
  private connection: mysql.Connection | null = null;
  private mongoConnected: boolean = false;

  async connectMySQL(dataSource: any): Promise<mysql.Connection> {
    try {
      this.connection = await mysql.createConnection({
        host: dataSource.host,
        port: dataSource.port,
        user: dataSource.username,
        password: dataSource.password,
        database: dataSource.database,
      });
      return this.connection;
    } catch (error) {
      console.error('MySQL连接失败:', error);
      throw new Error(`MySQL连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async connectMongoDB(dataSource: any): Promise<void> {
    try {
      const mongoUri = `mongodb://${dataSource.username}:${dataSource.password}@${dataSource.host}:${dataSource.port}/${dataSource.database}?authSource=admin`;
      await mongoose.connect(mongoUri);
      this.mongoConnected = true;
    } catch (error) {
      console.error('MongoDB连接失败:', error);
      throw new Error(`MongoDB连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
    if (this.mongoConnected) {
      await mongoose.disconnect();
      this.mongoConnected = false;
    }
  }

  async fetchSourceData(dataSource: any, queryStatement: string): Promise<any[]> {
    if (dataSource.type === 'mysql') {
      const conn = await this.connectMySQL(dataSource);
      const [rows] = await conn.query(queryStatement);
      return rows as any[];
    } else if (dataSource.type === 'mongodb') {
      await this.connectMongoDB(dataSource);
      const db = mongoose.connection.db;
      if (!db) throw new Error('MongoDB连接失败');
      
      const collectionName = this.extractMongoCollectionName(queryStatement);
      const collection = db.collection(collectionName);
      
      const pipeline = this.parseMongoQuery(queryStatement);
      if (pipeline.length > 0) {
        const cursor = collection.aggregate(pipeline);
        return await cursor.toArray();
      } else {
        const cursor = collection.find({});
        return await cursor.toArray();
      }
    } else {
      throw new Error(`不支持的数据源类型: ${dataSource.type}`);
    }
  }

  private extractMongoCollectionName(query: string): string {
    const collectionMatch = query.match(/\.getCollection\s*\(\s*['"]?([^'")\s]+)['"]?\s*\)/);
    if (collectionMatch) {
      return collectionMatch[1];
    }
    
    const directMatch = query.match(/db\.(\w+)\./);
    if (directMatch) {
      return directMatch[1];
    }
    
    const words = query.split(/\s+/);
    for (const word of words) {
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(word)) {
        return word;
      }
    }
    
    return 'collection';
  }

  private parseMongoQuery(query: string): any[] {
    try {
      const aggregateMatch = query.match(/aggregate\s*\(([\s\S]*)\)/);
      if (aggregateMatch) {
        const pipelineStr = aggregateMatch[1];
        return JSON.parse(pipelineStr);
      }
    } catch (error) {
      console.warn('解析MongoDB查询失败:', error);
    }
    return [];
  }

  async syncDataObject(
    dataObject: any,
    options: SyncOptions
  ): Promise<SyncResult> {
    const transaction = options.transaction;
    let syncResult: SyncResult;

    try {
      const dataSource = await DataSource.findByPk(dataObject.data_source_id);
      if (!dataSource) {
        throw new Error('数据源不存在');
      }

      const sourceData = await this.fetchSourceData(
        dataSource.toJSON() as any,
        dataObject.query_statement
      );

      const primaryKey = dataObject.primary_key;
      let newCount = 0;
      let updateCount = 0;
      let removedCount = 0;

      const existingRecords = await DataRecord.findAll({
        where: {
          data_object_id: dataObject.id,
          _sync_status: 'active',
        },
        attributes: ['record_id'],
        transaction,
      }) as any[];

      const existingRecordIds = new Set(existingRecords.map(r => r.record_id));
      const sourceRecordIds = new Set(sourceData.map(r => String(r[primaryKey])));

      for (const record of sourceData) {
        const recordId = String(record[primaryKey]);

        if (existingRecordIds.has(recordId)) {
          await DataRecord.update(
            {
              data: record,
              _synced_at: new Date(),
            },
            {
              where: { data_object_id: dataObject.id, record_id: recordId },
              transaction,
            }
          );
          updateCount++;
        } else {
          await DataRecord.create(
            {
              data_object_id: dataObject.id,
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

      if (options.strategy === 'full') {
        const recordsToRemove = Array.from(existingRecordIds).filter(
          id => !sourceRecordIds.has(id as string)
        );

        if (recordsToRemove.length > 0) {
          await DataRecord.update(
            { _sync_status: 'removed' },
            {
              where: {
                data_object_id: dataObject.id,
                record_id: { [Op.in]: recordsToRemove },
              },
              transaction,
            }
          );
          removedCount = recordsToRemove.length;
        }
      }

      await DataRecord.destroy({
        where: {
          data_object_id: dataObject.id,
          _sync_status: 'removed',
          _synced_at: {
            [Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        transaction,
      });

      syncResult = {
        success: true,
        total: sourceData.length,
        new: newCount,
        updated: updateCount,
        removed: removedCount,
        syncedAt: new Date(),
      };

    } catch (error) {
      console.error('同步数据失败:', error);
      syncResult = {
        success: false,
        total: 0,
        new: 0,
        updated: 0,
        removed: 0,
        error: error instanceof Error ? error.message : '未知错误',
        syncedAt: new Date(),
      };
    } finally {
      await this.disconnect();
    }

    return syncResult;
  }

  async testConnection(dataSource: any): Promise<{ success: boolean; message: string }> {
    try {
      if (dataSource.type === 'mysql') {
        const conn = await mysql.createConnection({
          host: dataSource.host,
          port: dataSource.port,
          user: dataSource.username,
          password: dataSource.password,
          database: dataSource.database,
        });
        await conn.ping();
        await conn.end();
        return { success: true, message: 'MySQL连接成功' };
      } else if (dataSource.type === 'mongodb') {
        const mongoUri = `mongodb://${dataSource.username}:${dataSource.password}@${dataSource.host}:${dataSource.port}/${dataSource.database}?authSource=admin`;
        await mongoose.connect(mongoUri);
        await mongoose.disconnect();
        return { success: true, message: 'MongoDB连接成功' };
      } else {
        return { success: false, message: `不支持的数据源类型: ${dataSource.type}` };
      }
    } catch (error) {
      return {
        success: false,
        message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  async previewQuery(dataSource: any, queryStatement: string, limit: number = 5): Promise<any[]> {
    try {
      const sourceData = await this.fetchSourceData(dataSource, queryStatement);
      return sourceData.slice(0, limit);
    } catch (error) {
      console.error('预览查询失败:', error);
      throw new Error(`预览查询失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      await this.disconnect();
    }
  }
}

export const syncService = new DataSyncService();
export default syncService;
