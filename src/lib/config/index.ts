import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

// 配置类型定义
export interface AppConfig {
  name: string;
  description: string;
  version: string;
  env: 'development' | 'staging' | 'production';
  port: number;
  host: string;
}

export interface DatabaseConfig {
  mysql: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    pool: {
      max: number;
      min: number;
      acquire: number;
      idle: number;
    };
    sync: boolean;
  };
  mongodb: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    enabled: boolean;
  };
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
  issuer: string;
  audience: string;
}

export interface SecurityConfig {
  bcryptRounds: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  cors: {
    enabled: boolean;
    origins: string[];
    methods: string[];
    credentials: boolean;
  };
}

export interface CASConfig {
  enabled: boolean;
  serverUrl: string;
  pathPrefix: string;
  version: '2.0' | '3.0';
  strictSSL: boolean;
  attributeMapping: {
    username: string;
    email: string;
    name: string;
  };
  defaultRoleId: number;
}

export interface OAuthProviderConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export interface OAuthConfig {
  github: OAuthProviderConfig;
  google: OAuthProviderConfig;
}

export interface OpenAIConfig {
  enabled: boolean;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  output: 'console' | 'file' | 'both';
  filePath: string;
  requestLog: boolean;
  auditLog: boolean;
}

export interface SyncConfig {
  batchSize: number;
  timeout: number;
  retryCount: number;
  retryInterval: number;
}

export interface UploadConfig {
  maxSize: number;
  allowedTypes: string[];
  storagePath: string;
}

export interface CacheConfig {
  type: 'memory' | 'redis';
  ttl: number;
  redis: {
    host: string;
    port: number;
    password: string;
    db: number;
  };
}

export interface EmailConfig {
  enabled: boolean;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: string;
  adminEmails: string[];
}

export interface FeaturesConfig {
  registration: boolean;
  aiTagging: boolean;
  auditLog: boolean;
  monitoring: boolean;
  dataExport: boolean;
}

export interface PaginationConfig {
  defaultPageSize: number;
  pageSizeOptions: number[];
  maxPageSize: number;
}

export interface SystemConfig {
  app: AppConfig;
  database: DatabaseConfig;
  jwt: JWTConfig;
  security: SecurityConfig;
  cas: CASConfig;
  oauth: OAuthConfig;
  openai: OpenAIConfig;
  logging: LoggingConfig;
  sync: SyncConfig;
  upload: UploadConfig;
  cache: CacheConfig;
  email: EmailConfig;
  features: FeaturesConfig;
  pagination: PaginationConfig;
}

// 单例配置实例
let configInstance: SystemConfig | null = null;

/**
 * 加载配置文件
 * @param configPath 配置文件路径，默认为 ./config/config.yaml
 */
export function loadConfig(configPath?: string): SystemConfig {
  const defaultConfigPath = path.resolve(process.cwd(), 'config', 'config.yaml');
  const filePath = configPath || defaultConfigPath;

  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Config file not found: ${filePath}, using default config`);
      return getDefaultConfig();
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const config = yaml.load(fileContent) as SystemConfig;
    
    // 合并默认配置，确保所有字段都有值
    const defaultConfig = getDefaultConfig();
    const mergedConfig = mergeConfig(defaultConfig, config);
    
    console.log(`Config loaded from: ${filePath}`);
    return mergedConfig;
  } catch (error) {
    console.error('Failed to load config:', error);
    console.warn('Using default config');
    return getDefaultConfig();
  }
}

/**
 * 获取默认配置
 */
function getDefaultConfig(): SystemConfig {
  return {
    app: {
      name: 'Tag Factory',
      description: '数据对象标签管理应用',
      version: '1.0.0',
      env: 'development',
      port: 3000,
      host: '0.0.0.0',
    },
    database: {
      mysql: {
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'root123',
        database: 'mydb',
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        sync: false,
      },
      mongodb: {
        host: 'localhost',
        port: 27017,
        username: 'root',
        password: 'root123',
        database: 'mymongo',
        enabled: true,
      },
    },
    jwt: {
      secret: 'your-secret-key-change-in-production',
      expiresIn: '7d',
      issuer: 'tag-factory',
      audience: 'tag-factory-users',
    },
    security: {
      bcryptRounds: 10,
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      cors: {
        enabled: true,
        origins: ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
      },
    },
    cas: {
      enabled: false,
      serverUrl: '',
      pathPrefix: '',
      version: '3.0',
      strictSSL: true,
      attributeMapping: {
        username: 'username',
        email: 'email',
        name: 'name',
      },
      defaultRoleId: 2,
    },
    oauth: {
      github: {
        enabled: false,
        clientId: '',
        clientSecret: '',
        callbackUrl: '',
      },
      google: {
        enabled: false,
        clientId: '',
        clientSecret: '',
        callbackUrl: '',
      },
    },
    openai: {
      enabled: false,
      apiKey: '',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 30000,
    },
    logging: {
      level: 'info',
      output: 'console',
      filePath: './logs/app.log',
      requestLog: true,
      auditLog: true,
    },
    sync: {
      batchSize: 1000,
      timeout: 300000,
      retryCount: 3,
      retryInterval: 5000,
    },
    upload: {
      maxSize: 50,
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'text/csv',
      ],
      storagePath: './uploads',
    },
    cache: {
      type: 'memory',
      ttl: 3600,
      redis: {
        host: 'localhost',
        port: 6379,
        password: '',
        db: 0,
      },
    },
    email: {
      enabled: false,
      smtp: {
        host: '',
        port: 587,
        secure: false,
        auth: {
          user: '',
          pass: '',
        },
      },
      from: 'noreply@tagfactory.local',
      adminEmails: [],
    },
    features: {
      registration: true,
      aiTagging: false,
      auditLog: true,
      monitoring: true,
      dataExport: true,
    },
    pagination: {
      defaultPageSize: 20,
      pageSizeOptions: [10, 20, 50, 100],
      maxPageSize: 1000,
    },
  };
}

/**
 * 合并配置（深度合并）
 */
function mergeConfig(defaultConfig: any, userConfig: any): any {
  const merged = { ...defaultConfig };

  for (const key in userConfig) {
    if (userConfig.hasOwnProperty(key)) {
      const k = key;
      if (
        typeof userConfig[k] === 'object' &&
        userConfig[k] !== null &&
        !Array.isArray(userConfig[k])
      ) {
        merged[k] = mergeConfig(
          defaultConfig[k],
          userConfig[k]
        );
      } else {
        merged[k] = userConfig[k];
      }
    }
  }

  return merged;
}

/**
 * 获取配置实例（单例模式）
 */
export function getConfig(): SystemConfig {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

/**
 * 重新加载配置
 */
export function reloadConfig(configPath?: string): SystemConfig {
  configInstance = loadConfig(configPath);
  return configInstance;
}

/**
 * 获取特定配置项
 */
export function getAppConfig(): AppConfig {
  return getConfig().app;
}

export function getDatabaseConfig(): DatabaseConfig {
  return getConfig().database;
}

export function getJWTConfig(): JWTConfig {
  return getConfig().jwt;
}

export function getSecurityConfig(): SecurityConfig {
  return getConfig().security;
}

export function getCASConfig(): CASConfig {
  return getConfig().cas;
}

export function getOAuthConfig(): OAuthConfig {
  return getConfig().oauth;
}

export function getOpenAIConfig(): OpenAIConfig {
  return getConfig().openai;
}

export function getLoggingConfig(): LoggingConfig {
  return getConfig().logging;
}

export function getSyncConfig(): SyncConfig {
  return getConfig().sync;
}

export function getUploadConfig(): UploadConfig {
  return getConfig().upload;
}

export function getCacheConfig(): CacheConfig {
  return getConfig().cache;
}

export function getEmailConfig(): EmailConfig {
  return getConfig().email;
}

export function getFeaturesConfig(): FeaturesConfig {
  return getConfig().features;
}

export function getPaginationConfig(): PaginationConfig {
  return getConfig().pagination;
}

// 导出默认配置实例
export default getConfig();
