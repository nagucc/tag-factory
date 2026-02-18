import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../mysql';

export interface AuditLogAttributes {
  id: number;
  user_id?: number;
  username?: string;
  action: string;
  resource_type: string;
  resource_id?: number;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  status: number;
  created_at?: Date;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'status'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: number;
  public user_id?: number;
  public username?: string;
  public action!: string;
  public resource_type!: string;
  public resource_id?: number;
  public details?: Record<string, unknown>;
  public ip_address?: string;
  public user_agent?: string;
  public status!: number;
  public readonly created_at!: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: '操作用户ID',
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作用户名',
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作类型: login/logout/create/update/delete/export/import',
    },
    resource_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '资源类型: users/roles/permissions/data-sources/data-objects/tags/work-plans 等',
    },
    resource_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: '资源ID',
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '操作详情',
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
  },
  {
    sequelize,
    tableName: 'tagfactory_audit_logs',
    modelName: 'AuditLog',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['action'] },
      { fields: ['resource_type'] },
      { fields: ['resource_id'] },
      { fields: ['created_at'] },
    ],
  }
);

export default AuditLog;
