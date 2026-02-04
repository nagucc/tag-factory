import sequelize from '../mysql';
import User from './user';
import Role from './role';
import Permission from './permission';
import RolePermission from './rolePermission';

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', as: 'roles' });

User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

export { sequelize, User, Role, Permission, RolePermission };
