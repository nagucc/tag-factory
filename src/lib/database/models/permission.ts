import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../mysql';

export interface PermissionAttributes {
  id: number;
  name: string;
  description?: string;
  resource: string;
  action: string;
  status: number;
  created_at?: Date;
  updated_at?: Date;
}

interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'id' | 'status'> {}

class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public resource!: string;
  public action!: string;
  public status!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    resource: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '资源类型，如 users, roles, data-sources 等',
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作类型，如 create, read, update, delete',
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '0: 禁用, 1: 启用',
    },
  },
  {
    sequelize,
    tableName: 'tagfactory_permissions',
    modelName: 'Permission',
  }
);

export default Permission;
