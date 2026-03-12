# Tag Factory 配置文件说明

本文档详细说明 Tag Factory 系统的配置文件 `config.yaml` 的使用方法。

## 配置文件位置

配置文件位于项目根目录的 `config` 文件夹中：

```
config/
├── config.yaml    # 主配置文件
└── README.md      # 本说明文档
```

## 快速开始

1. 复制默认配置文件（如果尚未创建）
2. 根据您的环境修改配置项
3. 重启应用使配置生效

## 配置项说明

### 1. 应用基础配置 (app)

```yaml
app:
  name: "Tag Factory"                    # 应用名称
  description: "数据对象标签管理应用"     # 应用描述
  version: "1.0.0"                       # 应用版本
  env: "development"                     # 运行环境: development | staging | production
  port: 3000                             # 服务端口
  host: "0.0.0.0"                        # 服务主机
```

### 2. 数据库配置 (database)

#### MySQL 配置

```yaml
database:
  mysql:
    host: "localhost"          # 数据库主机
    port: 3306                 # 数据库端口
    username: "root"           # 数据库用户名
    password: "root123"        # 数据库密码
    database: "mydb"           # 数据库名称
    pool:                      # 连接池配置
      max: 10                  # 最大连接数
      min: 0                   # 最小连接数
      acquire: 30000           # 获取连接超时时间（毫秒）
      idle: 10000              # 连接空闲时间（毫秒）
    sync: false                # 是否自动同步表结构（生产环境建议关闭）
```

#### MongoDB 配置

```yaml
  mongodb:
    host: "localhost"
    port: 27017
    username: "root"
    password: "root123"
    database: "mymongo"
    enabled: true              # 是否启用 MongoDB
```

### 3. JWT 认证配置 (jwt)

```yaml
jwt:
  secret: "your-secret-key"    # JWT 密钥（生产环境请使用强密钥）
  expiresIn: "7d"              # Token 有效期
  issuer: "tag-factory"        # 签发者
  audience: "tag-factory-users" # 受众
```

### 4. 安全配置 (security)

```yaml
security:
  bcryptRounds: 10             # 密码加密轮数
  maxLoginAttempts: 5          # 最大登录尝试次数
  lockoutDuration: 30          # 账户锁定时长（分钟）
  cors:                        # CORS 配置
    enabled: true
    origins:
      - "http://localhost:3000"
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    credentials: true
```

### 5. CAS 单点登录配置 (cas)

```yaml
cas:
  enabled: false                           # 是否启用 CAS 登录
  serverUrl: "https://ids.ynu.edu.cn"      # CAS 服务器根地址（不含路径）
  pathPrefix: "/authserver"                # CAS 服务端点路径前缀（可选）
  version: "3.0"                           # CAS 协议版本: "2.0" | "3.0"
  strictSSL: true                          # 是否验证 SSL 证书
  attributeMapping:                        # 用户属性映射
    username: "username"
    email: "email"
    name: "name"
  defaultRoleId: 2                         # 首次登录自动创建用户时的默认角色ID
```

**不同 CAS 服务器的配置示例：**

1. **标准 CAS（Apereo CAS）**
```yaml
cas:
  serverUrl: "https://cas.example.com"
  pathPrefix: "/cas"  # 或留空如果部署在根路径
```

2. **云南大学 CAS**
```yaml
cas:
  serverUrl: "https://ids.ynu.edu.cn"
  pathPrefix: "/authserver"
  version: "3.0"
```

3. **根路径部署的 CAS**
```yaml
cas:
  serverUrl: "https://sso.example.com"
  pathPrefix: ""  # 留空表示使用根路径
```

### 6. OAuth 配置 (oauth)

```yaml
oauth:
  github:
    enabled: false
    clientId: ""
    clientSecret: ""
    callbackUrl: ""
  google:
    enabled: false
    clientId: ""
    clientSecret: ""
    callbackUrl: ""
```

### 7. OpenAI 配置 (openai)

```yaml
openai:
  enabled: false               # 是否启用 AI 功能
  apiKey: ""                   # API Key
  model: "gpt-3.5-turbo"       # 模型名称
  temperature: 0.7             # 温度参数
  maxTokens: 2000              # 最大 Token 数
  timeout: 30000               # 请求超时（毫秒）
```

### 8. 日志配置 (logging)

```yaml
logging:
  level: "info"                # 日志级别: debug | info | warn | error
  output: "console"            # 日志输出方式: console | file | both
  filePath: "./logs/app.log"   # 日志文件路径
  requestLog: true             # 是否启用请求日志
  auditLog: true               # 是否启用操作审计日志
```

### 9. 数据同步配置 (sync)

```yaml
sync:
  batchSize: 1000              # 默认同步批次大小
  timeout: 300000              # 同步超时时间（毫秒）
  retryCount: 3                # 失败重试次数
  retryInterval: 5000          # 重试间隔（毫秒）
```

### 10. 文件上传配置 (upload)

```yaml
upload:
  maxSize: 50                  # 最大文件大小（MB）
  allowedTypes:                # 允许的文件类型
    - "image/jpeg"
    - "image/png"
    - "application/pdf"
    - "text/csv"
  storagePath: "./uploads"     # 上传文件存储路径
```

### 11. 缓存配置 (cache)

```yaml
cache:
  type: "memory"               # 缓存类型: memory | redis
  ttl: 3600                    # TTL（秒）
  redis:                       # Redis 配置
    host: "localhost"
    port: 6379
    password: ""
    db: 0
```

### 12. 邮件配置 (email)

```yaml
email:
  enabled: false
  smtp:
    host: ""
    port: 587
    secure: false
    auth:
      user: ""
      pass: ""
  from: "noreply@tagfactory.local"
  adminEmails: []
```

### 13. 系统功能开关 (features)

```yaml
features:
  registration: true           # 是否启用用户注册
  aiTagging: false             # 是否启用 AI 打标
  auditLog: true               # 是否启用审计日志
  monitoring: true             # 是否启用系统监控
  dataExport: true             # 是否启用数据导出
```

### 14. 分页配置 (pagination)

```yaml
pagination:
  defaultPageSize: 20          # 默认每页条数
  pageSizeOptions: [10, 20, 50, 100]  # 可选每页条数
  maxPageSize: 1000            # 最大每页条数
```

## 环境特定配置

### 开发环境 (development)

```yaml
app:
  env: "development"
  
logging:
  level: "debug"
  
database:
  mysql:
    sync: true                 # 开发环境可以开启自动同步
```

### 生产环境 (production)

```yaml
app:
  env: "production"
  
logging:
  level: "warn"
  output: "file"
  
database:
  mysql:
    sync: false                # 生产环境必须关闭自动同步
    
security:
  bcryptRounds: 12             # 生产环境增加加密轮数
```

## 配置热重载

系统支持配置热重载，修改配置文件后，可以通过以下方式重新加载：

1. **自动重载**：部分配置支持自动重载（如日志级别）
2. **手动重载**：调用配置管理 API 重新加载
3. **重启应用**：完全重新加载所有配置

## 安全配置建议

1. **生产环境**：
   - 修改默认的 JWT 密钥
   - 使用强密码
   - 关闭数据库自动同步
   - 启用 HTTPS
   - 配置适当的 CORS 策略

2. **敏感信息**：
   - 数据库密码
   - JWT 密钥
   - OAuth 客户端密钥
   - OpenAI API Key
   
   建议在生产环境中使用环境变量或密钥管理服务覆盖这些敏感配置。

## 故障排查

### 配置文件加载失败

1. 检查文件路径是否正确：`config/config.yaml`
2. 检查 YAML 语法是否正确（可以使用在线 YAML 验证工具）
3. 检查文件编码是否为 UTF-8

### 配置不生效

1. 确认配置文件已保存
2. 重启应用
3. 检查控制台日志中的配置加载信息

## 相关文档

- [系统架构文档](../docs/详细开发规划文档.md)
- [部署指南](../docs/部署文档.md)
