import sequelize from './mysql';
import User from './models/user';
import Role from './models/role';
import Permission from './models/permission';
import RolePermission from './models/rolePermission';
import DataSource from './models/dataSource';
import DataObject from './models/dataObject';
import DataRecord from './models/dataRecord';
import TagApplication from './models/tagApplication';
import Tag from './models/tag';
import TagGroup from './models/tagGroup';
import TagGroupRelation from './models/tagGroupRelation';
import TagRule from './models/tagRule';
import WorkPlan from './models/workPlan';
import WorkPlanTag from './models/workPlanTag';
import WorkPlanMember from './models/workPlanMember';
import WorkPlanRecord from './models/workPlanRecord';
import AuditLog from './models/auditLog';
import SystemConfig from './models/systemConfig';
import LoginLog from './models/loginLog';
import AITagTask from './models/aiTagTask';
import PromptTemplate from './models/promptTemplate';
import bcrypt from 'bcrypt';

const TABLE_PREFIX = 'tagfactory_';

async function checkAndCreateTable(tableName: string): Promise<boolean> {
  try {
    const [results] = await sequelize.query(
      `SHOW TABLES LIKE '${TABLE_PREFIX}${tableName}'`
    ) as any[];
    
    if (results.length === 0) {
      console.log(`表 ${TABLE_PREFIX}${tableName} 不存在，将创建...`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`检查表 ${TABLE_PREFIX}${tableName} 失败:`, error);
    return false;
  }
}

async function syncTable(model: any, tableName: string): Promise<void> {
  const exists = await checkAndCreateTable(tableName);
  if (!exists) {
    await model.sync();
    console.log(`表 ${TABLE_PREFIX}${tableName} 创建成功`);
  } else {
    console.log(`表 ${TABLE_PREFIX}${tableName} 已存在`);
  }
}

async function initializeDatabase(): Promise<void> {
  try {
    console.log('开始检查数据库表...');
    await sequelize.authenticate();
    console.log('数据库连接成功');

    await syncTable(User, 'users');
    await syncTable(Role, 'roles');
    await syncTable(Permission, 'permissions');
    await syncTable(RolePermission, 'role_permissions');
    await syncTable(DataSource, 'data_sources');
    await syncTable(DataObject, 'data_objects');
    await syncTable(DataRecord, 'data_records');
    await syncTable(Tag, 'tags');
    await syncTable(TagGroup, 'tag_groups');
    await syncTable(TagGroupRelation, 'tag_group_relations');
    await syncTable(TagApplication, 'tag_applications');
    await syncTable(TagRule, 'tag_rules');
    await syncTable(WorkPlan, 'work_plans');
    await syncTable(WorkPlanTag, 'work_plan_tags');
    await syncTable(WorkPlanMember, 'work_plan_members');
    await syncTable(WorkPlanRecord, 'work_plan_records');
    await syncTable(AuditLog, 'audit_logs');
    await syncTable(SystemConfig, 'system_configs');
    await syncTable(LoginLog, 'login_logs');
    await syncTable(AITagTask, 'ai_tag_tasks');
    await syncTable(PromptTemplate, 'prompt_templates');

    await sequelize.sync();
    console.log('数据库模型同步完成');

    const [roleResults] = await sequelize.query(
      `SELECT COUNT(*) as count FROM ${TABLE_PREFIX}roles`
    ) as any[];

    if (roleResults[0].count === 0) {
      console.log('正在初始化基础数据...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await sequelize.query(
        `INSERT INTO ${TABLE_PREFIX}users (username, password, email, status, created_at, updated_at) 
         VALUES ('admin', :password, 'admin@example.com', 1, NOW(), NOW())`,
        { replacements: { password: hashedPassword } }
      );

      await sequelize.query(
        `INSERT INTO ${TABLE_PREFIX}roles (name, description, status, created_at, updated_at) 
         VALUES ('超级管理员', '拥有所有权限', 1, NOW(), NOW())`
      );
      await sequelize.query(
        `INSERT INTO ${TABLE_PREFIX}roles (name, description, status, created_at, updated_at) 
         VALUES ('管理员', '拥有管理权限', 1, NOW(), NOW())`
      );
      await sequelize.query(
        `INSERT INTO ${TABLE_PREFIX}roles (name, description, status, created_at, updated_at) 
         VALUES ('普通用户', '拥有基本权限', 1, NOW(), NOW())`
      );

      await sequelize.query(
        `INSERT INTO ${TABLE_PREFIX}permissions (name, resource, action, description, status) 
         VALUES ('查看', 'all', 'read', '查看所有资源', 1)`
      );
      await sequelize.query(
        `INSERT INTO ${TABLE_PREFIX}permissions (name, resource, action, description, status) 
         VALUES ('创建', 'all', 'write', '创建资源', 1)`
      );
      await sequelize.query(
        `INSERT INTO ${TABLE_PREFIX}permissions (name, resource, action, description, status) 
         VALUES ('编辑', 'all', 'edit', '编辑资源', 1)`
      );
      await sequelize.query(
        `INSERT INTO ${TABLE_PREFIX}permissions (name, resource, action, description, status) 
         VALUES ('删除', 'all', 'delete', '删除资源', 1)`
      );

      await sequelize.query(
        `INSERT INTO ${TABLE_PREFIX}role_permissions (role_id, permission_id) VALUES (1, 1)`
      );
      await sequelize.query(
        `INSERT INTO ${TABLE_PREFIX}role_permissions (role_id, permission_id) VALUES (1, 2)`
      );
      await sequelize.query(
        `INSERT INTO ${TABLE_PREFIX}role_permissions (role_id, permission_id) VALUES (1, 3)`
      );
      await sequelize.query(
        `INSERT INTO ${TABLE_PREFIX}role_permissions (role_id, permission_id) VALUES (1, 4)`
      );

      await sequelize.query(
        `UPDATE ${TABLE_PREFIX}users SET role_id = 1 WHERE username = 'admin'`
      );

      console.log('基础数据初始化完成');
    }

    console.log('数据库初始化检查完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

export { initializeDatabase, checkAndCreateTable, syncTable };

initializeDatabase()
  .then(() => {
    console.log('数据库初始化成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  });
