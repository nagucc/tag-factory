import mysql from 'mysql2/promise';

const createTagsTable = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root123',
    database: process.env.DB_NAME || 'mydb',
  });

  try {
    console.log('正在创建标签表...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tagfactory_tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL COMMENT '标签名称',
        code VARCHAR(50) NOT NULL UNIQUE COMMENT '标签编码',
        parent_id INT DEFAULT NULL COMMENT '父标签ID',
        type ENUM('分类', '业务', '自定义') NOT NULL DEFAULT '自定义' COMMENT '标签类型',
        color VARCHAR(20) NOT NULL DEFAULT '#1890ff' COMMENT '标签颜色',
        description TEXT COMMENT '标签描述',
        status TINYINT NOT NULL DEFAULT 1 COMMENT '0: 禁用, 1: 启用',
        sort_order INT NOT NULL DEFAULT 0 COMMENT '排序顺序',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_parent_id (parent_id),
        INDEX idx_code (code),
        INDEX idx_type (type),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表'
    `);

    console.log('标签表创建成功！');
  } catch (error) {
    console.error('创建标签表失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
};

const createTagGroupsTable = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root123',
    database: process.env.DB_NAME || 'mydb',
  });

  try {
    console.log('正在创建标签分组表...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tagfactory_tag_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL COMMENT '分组名称',
        code VARCHAR(50) NOT NULL UNIQUE COMMENT '分组编码',
        description TEXT COMMENT '分组描述',
        color VARCHAR(20) COMMENT '分组颜色',
        parent_id INT DEFAULT NULL COMMENT '父分组ID',
        sort_order INT NOT NULL DEFAULT 0 COMMENT '排序顺序',
        status TINYINT NOT NULL DEFAULT 1 COMMENT '0: 禁用, 1: 启用',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_parent_id (parent_id),
        INDEX idx_code (code),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签分组表'
    `);

    console.log('标签分组表创建成功！');
  } catch (error) {
    console.error('创建标签分组表失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
};

const createTagGroupRelationsTable = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root123',
    database: process.env.DB_NAME || 'mydb',
  });

  try {
    console.log('正在创建标签分组关联表...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tagfactory_tag_group_relations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tag_id INT NOT NULL COMMENT '标签ID',
        group_id INT NOT NULL COMMENT '分组ID',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tag_id (tag_id),
        INDEX idx_group_id (group_id),
        UNIQUE KEY unique_tag_group (tag_id, group_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签分组关联表'
    `);

    console.log('标签分组关联表创建成功！');
  } catch (error) {
    console.error('创建标签分组关联表失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
};

async function migrate() {
  console.log('开始数据库迁移...');
  
  try {
    await createTagsTable();
    await createTagGroupsTable();
    await createTagGroupRelationsTable();
    
    console.log('数据库迁移完成！');
  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  }
}

migrate();
