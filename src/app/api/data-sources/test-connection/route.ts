import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, host, port, database, username, password } = body;

    if (!type || !host || !port || !database || !username || !password) {
      return NextResponse.json(
        { success: false, message: '缺少连接参数' },
        { status: 400 }
      );
    }

    if (type === 'mysql') {
      let connection = null;
      try {
        connection = await mysql.createConnection({
          host,
          port: parseInt(port),
          user: username,
          password,
          database,
          connectTimeout: 10000,
        });

        await connection.ping();

        const [rows] = await connection.query('SELECT VERSION() as version');

        await connection.end();

        return NextResponse.json({
          success: true,
          message: '连接成功',
          data: {
            version: (rows as any)[0]?.version,
          },
        });
      } catch (error: any) {
        if (connection) {
          try {
            await connection.end();
          } catch {}
        }
        console.error('MySQL连接测试失败:', error);
        return NextResponse.json(
          { success: false, message: `连接失败: ${error.message || '无法连接到数据库'}` },
          { status: 400 }
        );
      }
    } else if (type === 'mongodb') {
      const { MongoClient } = await import('mongodb');
      const uri = `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}?authSource=admin`;
      
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });

      try {
        await client.connect();
        await client.db(database).command({ ping: 1 });
        await client.close();

        return NextResponse.json({
          success: true,
          message: '连接成功',
          data: {
            version: 'MongoDB',
          },
        });
      } catch (error: any) {
        try {
          await client.close();
        } catch {}
        console.error('MongoDB连接测试失败:', error);
        return NextResponse.json(
          { success: false, message: `连接失败: ${error.message || '无法连接到数据库'}` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: `不支持的数据源类型: ${type}` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('连接测试失败:', error);
    return NextResponse.json(
      { success: false, message: `连接测试失败: ${error.message || '未知错误'}` },
      { status: 500 }
    );
  }
}
