import sequelize from '../mysql';
import User from './user';
import Role from './role';
import Permission from './permission';
import RolePermission from './rolePermission';
import DataSource from './dataSource';
import Tag from './tag';
import TagGroup from './tagGroup';
import TagGroupRelation from './tagGroupRelation';

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', as: 'roles' });

User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

Tag.belongsTo(Tag, { foreignKey: 'parent_id', as: 'parent' });
Tag.hasMany(Tag, { foreignKey: 'parent_id', as: 'children' });

TagGroup.belongsTo(TagGroup, { foreignKey: 'parent_id', as: 'parent' });
TagGroup.hasMany(TagGroup, { foreignKey: 'parent_id', as: 'children' });

export { sequelize, User, Role, Permission, RolePermission, DataSource, Tag, TagGroup, TagGroupRelation };
