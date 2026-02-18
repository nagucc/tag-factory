import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../mysql';

export interface LoginLogAttributes {
  id: number;
  user_id?: number;
  username: string;
  ip_address?: string;
  user_agent?: string;
  status: number;
  fail_reason?: string;
  created_at?: Date;
}

interface LoginLogCreationAttributes extends Optional<LoginLogAttributes, 'id' | 'status'> {}

class LoginLog extends Model<LoginLogAttributes, LoginLogCreationAttributes> implements LoginLogAttributes {
  public id!: number;
  public user_id?: number;
  public username!: string;
  public ip_address?: string;
  public user_agent?: string;
  public status!: number;
  public fail_reason?: string;
  public readonly created_at!: Date;
}

LoginLog.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: '用户ID',
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '登录用户名',
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP地址',
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '用户代理',
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '0: 失败, 1: 成功',
    },
    fail_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '失败原因',
    },
  },
  {
    sequelize,
    tableName: 'tagfactory_login_logs',
    modelName: 'LoginLog',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['username'] },
      { fields: ['status'] },
      { fields: ['created_at'] },
    ],
  }
);

export default LoginLog;
