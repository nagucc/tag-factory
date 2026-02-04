import sequelize from './mysql';
import User from './models/user';
import Role from './models/role';
import Permission from './models/permission';
import RolePermission from './models/rolePermission';
import bcrypt from 'bcrypt';

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', as: 'roles' });

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    await sequelize.sync({ force: true });
    console.log('数据库模型同步完成');

    const permissions = await Permission.bulkCreate([
      { name: '用户管理-查看', resource: 'users', action: 'read', description: '查看用户列表和详情' },
      { name: '用户管理-创建', resource: 'users', action: 'create', description: '创建新用户' },
      { name: '用户管理-编辑', resource: 'users', action: 'update', description: '编辑用户信息' },
      { name: '用户管理-删除', resource: 'users', action: 'delete', description: '删除用户' },
      { name: '角色管理-查看', resource: 'roles', action: 'read', description: '查看角色列表和详情' },
      { name: '角色管理-创建', resource: 'roles', action: 'create', description: '创建新角色' },
      { name: '角色管理-编辑', resource: 'roles', action: 'update', description: '编辑角色信息' },
      { name: '角色管理-删除', resource: 'roles', action: 'delete', description: '删除角色' },
      { name: '权限管理-查看', resource: 'permissions', action: 'read', description: '查看权限列表和详情' },
      { name: '权限管理-管理', resource: 'permissions', action: 'manage', description: '管理权限分配' },
      { name: '数据源-查看', resource: 'data-sources', action: 'read', description: '查看数据源列表和详情' },
      { name: '数据源-创建', resource: 'data-sources', action: 'create', description: '创建数据源' },
      { name: '数据源-编辑', resource: 'data-sources', action: 'update', description: '编辑数据源' },
      { name: '数据源-删除', resource: 'data-sources', action: 'delete', description: '删除数据源' },
      { name: '数据对象-查看', resource: 'data-objects', action: 'read', description: '查看数据对象' },
      { name: '标签管理-查看', resource: 'tags', action: 'read', description: '查看标签' },
      { name: '标签管理-创建', resource: 'tags', action: 'create', description: '创建标签' },
      { name: '标签管理-编辑', resource: 'tags', action: 'update', description: '编辑标签' },
      { name: '标签管理-删除', resource: 'tags', action: 'delete', description: '删除标签' },
      { name: '系统配置-查看', resource: 'system', action: 'read', description: '查看系统配置' },
      { name: '系统配置-管理', resource: 'system', action: 'manage', description: '管理系统配置' },
    ]);
    console.log('权限数据创建完成');

    const adminRole = await Role.create({
      name: 'admin',
      description: '超级管理员，拥有所有权限',
    });

    const userRole = await Role.create({
      name: 'user',
      description: '普通用户，可以管理数据源和数据对象',
    });

    const viewerRole = await Role.create({
      name: 'viewer',
      description: '只读用户，只能查看数据',
    });

    for (const permission of permissions) {
      await RolePermission.create({
        role_id: adminRole.id,
        permission_id: permission.id,
      });
    }
    console.log('管理员角色权限分配完成');

    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      email: 'admin@tagfactory.local',
      password: hashedPassword,
      role_id: adminRole.id,
    });
    console.log('管理员用户创建完成（用户名: admin，密码: admin123）');

    console.log('数据库初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

initializeDatabase();
