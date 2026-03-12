import { DataTypes } from 'sequelize';
import sequelize from '../mysql';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '0: 禁用, 1: 启用',
  },
  auth_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'local',
    comment: '认证类型: local/ldap/oauth/cas',
  },
  auth_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '外部认证系统用户ID',
  },
  failed_login_attempts: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'tagfactory_users',
  modelName: 'User',
});

export default User;
