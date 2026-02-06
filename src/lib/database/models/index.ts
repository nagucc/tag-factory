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
  TagApplication
};
