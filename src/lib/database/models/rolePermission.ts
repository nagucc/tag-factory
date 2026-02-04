import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../mysql';

export interface RolePermissionAttributes {
  id: number;
  role_id: number;
  permission_id: number;
  created_at?: Date;
}

interface RolePermissionCreationAttributes extends Optional<RolePermissionAttributes, 'id'> {}

class RolePermission extends Model<RolePermissionAttributes, RolePermissionCreationAttributes> implements RolePermissionAttributes {
  public id!: number;
  public role_id!: number;
  public permission_id!: number;
  public readonly created_at!: Date;
}

RolePermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tagfactory_roles',
        key: 'id',
      },
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tagfactory_permissions',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'tagfactory_role_permissions',
    modelName: 'RolePermission',
  }
);

export default RolePermission;
