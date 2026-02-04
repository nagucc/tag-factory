import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../mysql';
import Permission from './permission';

export interface RoleAttributes {
  id: number;
  name: string;
  description?: string;
  status: number;
  created_at?: Date;
  updated_at?: Date;
}

interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'status'> {}

class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public status!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public setPermissions!: (permissions: Permission[]) => Promise<void>;
  public getPermissions!: () => Promise<Permission[]>;
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
    tableName: 'tagfactory_roles',
    modelName: 'Role',
  }
);

export default Role;
