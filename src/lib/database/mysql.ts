import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';
import { getDatabaseConfig } from '@/lib/config';

// 获取数据库配置
const dbConfig = getDatabaseConfig().mysql;

const sequelize = new Sequelize({
  dialect: 'mysql',
  dialectModule: mysql2,
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
  },
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

export default sequelize;
