'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Space, App } from 'antd';
import { DatabaseOutlined, NodeIndexOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

interface DataSourceFormProps {
  initialValues?: any;
  onSubmit: (values: any) => Promise<void>;
  onReset?: () => void;
  loading?: boolean;
}

const { Option } = Select;
const { TextArea } = Input;

const DataSourceForm = forwardRef<any, DataSourceFormProps>(({ initialValues, onSubmit, onReset, loading }, ref) => {
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { message } = App.useApp();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        name: initialValues.name,
        type: initialValues.type,
        host: initialValues.host,
        port: initialValues.port,
        database: initialValues.database,
        username: initialValues.username,
        password: initialValues.password,
        description: initialValues.description,
      });
    }
  }, [initialValues, form]);

  useImperativeHandle(ref, () => ({
    resetForm: () => {
      form.resetFields();
      setTestResult(null);
    },
    getFieldsValue: () => form.getFieldsValue(),
  }));

  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields(['type', 'host', 'port', 'database', 'username', 'password']);
      setTesting(true);
      setTestResult(null);

      const response = await fetch('/api/data-sources/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      setTestResult({
        success: data.success,
        message: data.message,
      });

      if (data.success) {
        message.success(data.message);
      } else {
        message.error(data.message);
      }
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      message.error('测试连接失败');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!initialValues?.id) {
      await form.validateFields(['type', 'host', 'port', 'database', 'username', 'password']);
    }
    await onSubmit(values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ type: 'mysql', port: 3306 }}
    >
      <Card title={<><DatabaseOutlined /> 基本信息</>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="name"
              label="数据源名称"
              rules={[{ required: true, message: '请输入数据源名称' }]}
            >
              <Input placeholder="请输入数据源名称" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="type"
              label="数据源类型"
              rules={[{ required: true, message: '请选择数据源类型' }]}
            >
              <Select placeholder="请选择数据源类型">
                <Option value="mysql">MySQL</Option>
                <Option value="mongodb">MongoDB</Option>
                <Option value="postgresql">PostgreSQL</Option>
                <Option value="oracle">Oracle</Option>
                <Option value="sqlite">SQLite</Option>
                <Option value="mssql">SQL Server</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Form.Item
              name="description"
              label="描述"
            >
              <TextArea rows={1} placeholder="数据源描述（选填）" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title={<><NodeIndexOutlined /> 连接配置</>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="host"
              label="主机地址"
              rules={[{ required: true, message: '请输入主机地址' }]}
            >
              <Input placeholder="如: localhost 或 127.0.0.1" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="port"
              label="端口号"
              rules={[{ required: true, message: '请输入端口号' }]}
            >
              <Input type="number" placeholder="如: 3306" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="database"
              label="数据库名称"
              rules={[{ required: true, message: '请输入数据库名称' }]}
            >
              <Input placeholder="请输入数据库名称" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入数据库用户名" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入数据库密码" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card>
        <Space>
          <Button
            type="primary"
            icon={<SafetyCertificateOutlined />}
            onClick={handleTestConnection}
            loading={testing}
          >
            测试连接
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialValues?.id ? '保存修改' : '创建数据源'}
          </Button>
          <Button onClick={() => form.resetFields()}>重置</Button>
        </Space>
        {testResult && (
          <div style={{ marginTop: 16, color: testResult.success ? '#52c41a' : '#ff4d4f' }}>
            {testResult.message}
          </div>
        )}
      </Card>
    </Form>
  );
});

DataSourceForm.displayName = 'DataSourceForm';

export default DataSourceForm;
