'use client';

import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Select, Typography, App, Divider, Space, Switch } from 'antd';
import { SaveOutlined, SecurityScanOutlined, GlobalOutlined, UserOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;
const { Option } = Select;

interface SystemConfig {
  appName: string;
  appEnv: string;
  jwtExpiresIn: string;
  maxLoginAttempts: number;
  lockoutDuration: number;
  casEnabled: boolean;
  casServerUrl: string;
  casPathPrefix: string;
  casVersion: string;
}

export default function SystemConfigPage() {
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/system/config');
      const data = await response.json();
      if (data.success) {
        form.setFieldsValue(data.data);
      }
    } catch {
      message.error('获取系统配置失败');
    }
  };

  const handleSave = async (values: SystemConfig) => {
    setSaving(true);
    try {
      const response = await fetch('/api/system/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (data.success) {
        message.success('系统配置已保存');
      } else {
        message.error(data.message || '保存配置失败');
      }
    } catch {
      message.error('保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  const pageContent = (
    <>
      <Title level={2}>系统配置</Title>
      <Text type="secondary">管理系统核心参数和安全设置</Text>
      
      <Divider />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        style={{ maxWidth: 600 }}
      >
        <Card 
          title={<><GlobalOutlined /> 基础配置</>} 
          style={{ marginBottom: 24 }}
        >
          <Form.Item
            name="appName"
            label="应用名称"
            rules={[{ required: true, message: '请输入应用名称' }]}
          >
            <Input prefix={<GlobalOutlined />} placeholder="应用名称" />
          </Form.Item>

          <Form.Item
            name="appEnv"
            label="运行环境"
          >
            <Select>
              <Option value="development">开发环境</Option>
              <Option value="staging">测试环境</Option>
              <Option value="production">生产环境</Option>
            </Select>
          </Form.Item>
        </Card>

        <Card 
          title={<><SecurityScanOutlined /> 安全配置</>}
          style={{ marginBottom: 24 }}
        >
          <Form.Item
            name="maxLoginAttempts"
            label="最大登录尝试次数"
            tooltip="用户登录失败最大次数，超过后将锁定账户"
          >
            <Input type="number" min={1} max={10} />
          </Form.Item>

          <Form.Item
            name="lockoutDuration"
            label="账户锁定时长（分钟）"
            tooltip="账户被锁定后，需要等待的时间"
          >
            <Input type="number" min={5} max={1440} />
          </Form.Item>

          <Form.Item
            name="jwtExpiresIn"
            label="JWT令牌有效期"
          >
            <Select>
              <Option value="1h">1小时</Option>
              <Option value="6h">6小时</Option>
              <Option value="1d">1天</Option>
              <Option value="7d">7天</Option>
              <Option value="30d">30天</Option>
            </Select>
          </Form.Item>
        </Card>

        <Card title={<><UserOutlined /> 用户配置</>} style={{ marginBottom: 24 }}>
          <Form.Item
            name="defaultRole"
            label="新用户默认角色"
          >
            <Select>
              <Option value="user">普通用户</Option>
              <Option value="viewer">只读用户</Option>
            </Select>
          </Form.Item>
        </Card>

        <Card title={<><SafetyCertificateOutlined /> CAS单点登录配置</>} style={{ marginBottom: 24 }}>
          <Form.Item
            name="casEnabled"
            label="启用CAS登录"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="casServerUrl"
            label="CAS服务器地址"
            tooltip="CAS服务器的根地址，不含路径，如 https://ids.ynu.edu.cn"
          >
            <Input placeholder="https://ids.ynu.edu.cn" />
          </Form.Item>

          <Form.Item
            name="casPathPrefix"
            label="CAS路径前缀"
            tooltip="CAS服务端点路径前缀，标准CAS留空，云南大学CAS填 /authserver"
          >
            <Input placeholder="/authserver" />
          </Form.Item>

          <Form.Item
            name="casVersion"
            label="CAS协议版本"
          >
            <Select>
              <Option value="3.0">CAS 3.0（推荐）</Option>
              <Option value="2.0">CAS 2.0</Option>
            </Select>
          </Form.Item>

          <Text type="secondary" style={{ fontSize: 12 }}>
            注意：CAS配置保存在 config/config.yaml 文件中。
            标准CAS路径示例：https://cas.example.com/cas/login
            云南大学CAS路径示例：https://ids.ynu.edu.cn/authserver/login
          </Text>
        </Card>

        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              loading={saving}
              htmlType="submit"
            >
              保存配置
            </Button>
            <Button onClick={() => form.resetFields()}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </>
  );

  return <MainLayout title="系统配置">{pageContent}</MainLayout>;
}
