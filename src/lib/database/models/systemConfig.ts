import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../mysql';

export interface SystemConfigAttributes {
  id: number;
  config_key: string;
  config_value: string;
  config_type: string;
  description?: string;
  category: string;
  is_encrypted: number;
  created_at?: Date;
  updated_at?: Date;
}

interface SystemConfigCreationAttributes extends Optional<SystemConfigAttributes, 'id' | 'is_encrypted'> {}

class SystemConfig extends Model<SystemConfigAttributes, SystemConfigCreationAttributes> implements SystemConfigAttributes {
  public id!: number;
  public config_key!: string;
  public config_value!: string;
  public config_type!: string;
  public description?: string;
  public category!: string;
  public is_encrypted!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

SystemConfig.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    config_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '配置键',
    },
    config_value: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '配置值',
    },
    config_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'string',
      comment: '类型: string/number/json/boolean',
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'general',
      comment: '分类: general/security/oauth/monitoring',
    },
    is_encrypted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否加密存储',
    },
  },
  {
    sequelize,
    tableName: 'tagfactory_system_configs',
    modelName: 'SystemConfig',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default SystemConfig;
