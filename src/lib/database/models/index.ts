import sequelize from '../mysql';
import User from './user';
import Role from './role';
import Permission from './permission';
import RolePermission from './rolePermission';
import DataSource from './dataSource';
import Tag from './tag';
import TagGroup from './tagGroup';
import TagGroupRelation from './tagGroupRelation';
import DataObject from './dataObject';
import DataRecord from './dataRecord';
import TagApplication from './tagApplication';
import TagRule from './tagRule';
import WorkPlan from './workPlan';
import WorkPlanTag from './workPlanTag';
import WorkPlanMember from './workPlanMember';
import WorkPlanRecord from './workPlanRecord';
import AuditLog from './auditLog';
import SystemConfig from './systemConfig';
import LoginLog from './loginLog';

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', as: 'roles' });

User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

Tag.belongsTo(Tag, { foreignKey: 'parent_id', as: 'parent' });
Tag.hasMany(Tag, { foreignKey: 'parent_id', as: 'children' });

TagGroup.belongsTo(TagGroup, { foreignKey: 'parent_id', as: 'parent' });
TagGroup.hasMany(TagGroup, { foreignKey: 'parent_id', as: 'children' });

DataSource.hasMany(DataObject, { foreignKey: 'data_source_id', as: 'dataObjects' });
DataObject.belongsTo(DataSource, { foreignKey: 'data_source_id', as: 'dataSource' });

DataObject.hasMany(DataRecord, { foreignKey: 'data_object_id', as: 'records' });
DataRecord.belongsTo(DataObject, { foreignKey: 'data_object_id', as: 'dataObject' });

DataObject.hasMany(TagApplication, { foreignKey: 'data_object_id', as: 'tagApplications' });
TagApplication.belongsTo(DataObject, { foreignKey: 'data_object_id', as: 'dataObject' });

Tag.hasMany(TagApplication, { foreignKey: 'tag_id', as: 'tagApplications' });
TagApplication.belongsTo(Tag, { foreignKey: 'tag_id', as: 'tag' });

User.hasMany(TagApplication, { foreignKey: 'applied_by', as: 'appliedTagApplications' });
TagApplication.belongsTo(User, { foreignKey: 'applied_by', as: 'applier' });

DataObject.hasMany(TagRule, { foreignKey: 'data_object_id', as: 'tagRules' });
TagRule.belongsTo(DataObject, { foreignKey: 'data_object_id', as: 'dataObject' });

Tag.hasMany(TagRule, { foreignKey: 'tag_id', as: 'tagRules' });
TagRule.belongsTo(Tag, { foreignKey: 'tag_id', as: 'tag' });

User.hasMany(TagRule, { foreignKey: 'created_by', as: 'createdTagRules' });
TagRule.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

DataObject.hasMany(WorkPlan, { foreignKey: 'data_object_id', as: 'workPlans' });
WorkPlan.belongsTo(DataObject, { foreignKey: 'data_object_id', as: 'dataObject' });

User.hasMany(WorkPlan, { foreignKey: 'created_by', as: 'createdWorkPlans' });
WorkPlan.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

WorkPlan.hasMany(WorkPlanTag, { foreignKey: 'work_plan_id', as: 'workPlanTags' });
WorkPlanTag.belongsTo(WorkPlan, { foreignKey: 'work_plan_id', as: 'workPlan' });

Tag.hasMany(WorkPlanTag, { foreignKey: 'tag_id', as: 'workPlanTags' });
WorkPlanTag.belongsTo(Tag, { foreignKey: 'tag_id', as: 'tag' });

WorkPlan.hasMany(WorkPlanMember, { foreignKey: 'work_plan_id', as: 'workPlanMembers' });
WorkPlanMember.belongsTo(WorkPlan, { foreignKey: 'work_plan_id', as: 'workPlan' });

User.hasMany(WorkPlanMember, { foreignKey: 'user_id', as: 'workPlanMembers' });
WorkPlanMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

WorkPlan.hasMany(WorkPlanRecord, { foreignKey: 'work_plan_id', as: 'workPlanRecords' });
WorkPlanRecord.belongsTo(WorkPlan, { foreignKey: 'work_plan_id', as: 'workPlan' });

User.hasMany(WorkPlanRecord, { foreignKey: 'tagged_by', as: 'taggedRecords' });
WorkPlanRecord.belongsTo(User, { foreignKey: 'tagged_by', as: 'tagger' });

Tag.hasMany(WorkPlanRecord, { foreignKey: 'tag_id', as: 'workPlanRecords' });
WorkPlanRecord.belongsTo(Tag, { foreignKey: 'tag_id', as: 'tag' });

User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(LoginLog, { foreignKey: 'user_id', as: 'loginLogs' });
LoginLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export { 
  sequelize, 
  User, 
  Role, 
  Permission, 
  RolePermission, 
  DataSource, 
  Tag, 
  TagGroup, 
  TagGroupRelation,
  DataObject,
  DataRecord,
  TagApplication,
  TagRule,
  WorkPlan,
  WorkPlanTag,
  WorkPlanMember,
  WorkPlanRecord,
  AuditLog,
  SystemConfig,
  LoginLog
};
