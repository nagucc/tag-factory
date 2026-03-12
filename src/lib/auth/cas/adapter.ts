import { parseStringPromise } from 'xml2js';

export interface CASConfig {
  serverUrl: string;
  serviceUrl: string;
  version: '2.0' | '3.0';
  strictSSL?: boolean;
  /**
   * CAS 服务端点路径前缀
   * 默认为空（标准 CAS 路径）
   * 例如：云南大学 CAS 使用 '/authserver'
   */
  pathPrefix?: string;
}

export interface CASUserInfo {
  id: string;
  username: string;
  email?: string;
  name?: string;
  attributes?: Record<string, string | string[]>;
}

export interface CASProvider {
  name: string;
  config: CASConfig;
  getLoginUrl(): string;
  getLogoutUrl(): string;
  validateTicket(ticket: string): Promise<CASUserInfo>;
}

export class CASProviderImpl implements CASProvider {
  name = 'cas';
  config: CASConfig;

  constructor(config: CASConfig) {
    this.config = {
      strictSSL: true,
      pathPrefix: '',
      ...config,
    };
  }

  /**
   * 获取路径前缀
   */
  private getPathPrefix(): string {
    return this.config.pathPrefix || '';
  }

  /**
   * 获取CAS登录URL
   */
  getLoginUrl(): string {
    const params = new URLSearchParams({
      service: this.config.serviceUrl,
    });
    const prefix = this.getPathPrefix();
    return `${this.config.serverUrl}${prefix}/login?${params.toString()}`;
  }

  /**
   * 获取CAS登出URL
   */
  getLogoutUrl(): string {
    const params = new URLSearchParams({
      service: this.config.serviceUrl,
    });
    const prefix = this.getPathPrefix();
    return `${this.config.serverUrl}${prefix}/logout?${params.toString()}`;
  }

  /**
   * 验证CAS服务票据（ST）
   */
  async validateTicket(ticket: string): Promise<CASUserInfo> {
    const validateUrl = this.buildValidateUrl(ticket);
    console.log('CAS validate URL:', validateUrl);

    try {
      // 增加超时时间到 30 秒
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(validateUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`CAS validation failed: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      console.log('CAS validation response:', xmlText.substring(0, 500));
      return this.parseValidationResponse(xmlText);
    } catch (error) {
      console.error('CAS ticket validation error:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('CAS server connection timeout (30s)');
        }
        throw new Error(`CAS ticket validation failed: ${error.message}`);
      }
      throw new Error('CAS ticket validation failed');
    }
  }

  /**
   * 构建票据验证URL
   */
  private buildValidateUrl(ticket: string): string {
    const params = new URLSearchParams({
      ticket,
      service: this.config.serviceUrl,
    });

    const prefix = this.getPathPrefix();

    // CAS 3.0 使用 /p3/serviceValidate 或 /p3/proxyValidate，支持返回用户属性
    // CAS 2.0 使用 /serviceValidate
    // 注意：某些 CAS 服务器（如云南大学）使用 /authserver/p3/proxyValidate
    let validatePath: string;
    if (this.config.version === '3.0') {
      // 优先使用 p3/proxyValidate，如果不支持会 fallback 到 p3/serviceValidate
      validatePath = `${prefix}/p3/proxyValidate`;
    } else {
      validatePath = `${prefix}/serviceValidate`;
    }

    return `${this.config.serverUrl}${validatePath}?${params.toString()}`;
  }

  /**
   * 解析CAS验证响应
   */
  private async parseValidationResponse(xmlText: string): Promise<CASUserInfo> {
    try {
      const result = await parseStringPromise(xmlText, {
        explicitArray: false,
        tagNameProcessors: [(name) => name.replace(/^cas:/, '')],
      });

      const serviceResponse = result.serviceResponse;

      // 检查认证失败
      if (serviceResponse.authenticationFailure) {
        const failure = serviceResponse.authenticationFailure;
        const code = failure.$.code || 'UNKNOWN';
        throw new Error(`CAS authentication failed: ${code}`);
      }

      // 解析认证成功响应
      if (serviceResponse.authenticationSuccess) {
        const success = serviceResponse.authenticationSuccess;
        const userInfo: CASUserInfo = {
          id: success.user,
          username: success.user,
        };

        // 解析用户属性（CAS 3.0）
        if (success.attributes) {
          const attributes = this.parseAttributes(success.attributes);
          userInfo.attributes = attributes;

          // 提取常用属性
          if (attributes.email) {
            userInfo.email = Array.isArray(attributes.email)
              ? attributes.email[0]
              : attributes.email;
          }
          if (attributes.name || attributes.displayName || attributes.cn) {
            const nameValue = attributes.name || attributes.displayName || attributes.cn;
            userInfo.name = Array.isArray(nameValue) ? nameValue[0] : nameValue;
          }
        }

        return userInfo;
      }

      throw new Error('Invalid CAS response format');
    } catch (error) {
      console.error('CAS response parsing error:', error);
      throw new Error('Failed to parse CAS validation response');
    }
  }

  /**
   * 解析用户属性
   */
  private parseAttributes(attributesObj: Record<string, unknown>): Record<string, string | string[]> {
    const attributes: Record<string, string | string[]> = {};

    for (const [key, value] of Object.entries(attributesObj)) {
      if (key === '$') continue; // 跳过属性节点

      if (Array.isArray(value)) {
        // 如果数组只有一个元素，直接取该元素
        if (value.length === 1) {
          attributes[key] = value[0];
        } else {
          attributes[key] = value;
        }
      } else if (typeof value === 'string') {
        attributes[key] = value;
      } else if (value !== null && typeof value === 'object') {
        // 处理嵌套对象（某些CAS服务器可能返回这种格式）
        attributes[key] = JSON.stringify(value);
      }
    }

    return attributes;
  }
}

/**
 * 创建CAS Provider实例
 */
export function createCASProvider(config: CASConfig): CASProvider {
  return new CASProviderImpl(config);
}
