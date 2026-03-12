'use client';

import { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Card, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { App } from 'antd';

const { Title, Text } = Typography;

interface LoginFormProps {
  initialCasEnabled?: boolean;
}

export default function LoginForm({ initialCasEnabled = false }: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [casEnabled, setCasEnabled] = useState(initialCasEnabled);
  const initialCasEnabledRef = useRef(initialCasEnabled);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();

  // 检查URL中的错误参数
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      const errorMessages: Record<string, string> = {
        cas_no_ticket: 'CAS登录失败：未获取到登录票据',
        cas_not_configured: 'CAS未配置，请联系管理员',
        cas_failed: 'CAS登录失败，请稍后重试',
        account_disabled: '账户已被禁用，请联系管理员',
      };
      message.error(errorMessages[error] || '登录失败');
    }
  }, [searchParams, message]);

  // 检查CAS是否启用（仅在客户端执行，且服务端未启用时）
  useEffect(() => {
    // 如果服务端已经确认启用，不需要再请求
    if (initialCasEnabledRef.current) {
      console.log('CAS enabled from server-side config');
      return;
    }
    
    const checkCasConfig = async () => {
      try {
        const response = await fetch('/api/auth/cas/config');
        const data = await response.json();
        console.log('CAS config response:', data);
        setCasEnabled(data.enabled);
      } catch (error) {
        // CAS配置获取失败，不显示CAS登录按钮
        console.error('Failed to fetch CAS config:', error);
        setCasEnabled(false);
      }
    };
    checkCasConfig();
  }, []); // 空依赖数组，只在组件挂载时执行

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        message.success('登录成功');
        localStorage.setItem('auth_token', data.data.token);
        router.push('/');
        router.refresh();
      } else {
        message.error(data.message || '登录失败');
      }
    } catch {
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // CAS登录
  const handleCasLogin = () => {
    window.location.href = '/api/auth/cas/login';
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5',
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>Tag Factory</Title>
          <Text type="secondary">数据对象标签管理应用</Text>
        </div>
        
        <Form
          name="login"
          onFinish={onFinish}
          size="large"
          initialValues={{ username: 'admin' }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码" 
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        {casEnabled && (
          <>
            <Divider>
              <Text type="secondary" style={{ fontSize: 12 }}>或</Text>
            </Divider>
            <Button
              icon={<SafetyCertificateOutlined />}
              onClick={handleCasLogin}
              block
              size="large"
              style={{ marginBottom: 16 }}
            >
              CAS单点登录
            </Button>
          </>
        )}
        
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            默认账号: admin / admin123
          </Text>
        </div>
      </Card>
    </div>
  );
}
