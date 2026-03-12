/**
 * 数据库迁移脚本：添加 auth_type 和 auth_id 字段到 users 表
 * 
 * 执行方式：
 * npx ts-node src/scripts/migrate-add-auth-fields.ts
 */

import sequelize from '../lib/database/mysql';

async function migrate() {
  try {
    console.log('Starting migration...');
    
    // 检查字段是否已存在
    const [results] = await sequelize.query(
      `SHOW COLUMNS FROM tagfactory_users LIKE 'auth_type'`
    );
    
    if (results.length > 0) {
      console.log('auth_type field already exists, skipping...');
    } else {
      console.log('Adding auth_type field...');
      await sequelize.query(
        `ALTER TABLE tagfactory_users 
         ADD COLUMN auth_type VARCHAR(20) NOT NULL DEFAULT 'local' 
         COMMENT '认证类型: local/ldap/oauth/cas' 
         AFTER status`
      );
      console.log('auth_type field added successfully');
    }
    
    // 检查 auth_id 字段
    const [results2] = await sequelize.query(
      `SHOW COLUMNS FROM tagfactory_users LIKE 'auth_id'`
    );
    
    if (results2.length > 0) {
      console.log('auth_id field already exists, skipping...');
    } else {
      console.log('Adding auth_id field...');
      await sequelize.query(
        `ALTER TABLE tagfactory_users 
         ADD COLUMN auth_id VARCHAR(100) NULL 
         COMMENT '外部认证系统用户ID' 
         AFTER auth_type`
      );
      console.log('auth_id field added successfully');
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
