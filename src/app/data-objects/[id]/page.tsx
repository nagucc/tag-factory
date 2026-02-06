'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { message } from 'antd';
import {
  Card, Row, Col, Typography, Button, Space, Tag, Descriptions,
  Tabs, Statistic, Badge, Spin, Alert,
  Modal, Form, Input, Select, Switch,
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, SyncOutlined,
  DatabaseOutlined, FileTextOutlined, ClockCircleOutlined,
  CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined,
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { validateTemplate } from '@/lib/utils/displayTemplate';

const { Text, Title } = Typography;

interface DataObjectDetail {
  id: number;
  name: string;
  description?: string;
  data_source_id: number;
  data_source?: {
    id: number;
    name: string;
    type: string;
    host: string;
    port: number;
    database: string;
  };
  query_statement: string;
  primary_key: string;
  display_template: string;
  sync_enabled: boolean;
  sync_cron?: string;
  sync_strategy: string;
  last_sync_at?: string;
  last_sync_status?: string;
  sync_count: number;
  record_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

function CodeBlock({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <code style={{
      display: 'block',
      padding: 12,
      whiteSpace: 'pre-wrap',
      backgroundColor: '#f5f5f5',
      borderRadius: 4,
      fontFamily: 'monospace',
      fontSize: 13,
      ...style,
    }}>
      {children}
    </code>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code style={{
      padding: '2px 6px',
      backgroundColor: '#f5f5f5',
      borderRadius: 3,
      fontFamily: 'monospace',
      fontSize: 13,
    }}>
      {children}
    </code>
  );
}

export default function DataObjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [detail, setDetail] = useState<DataObjectDetail | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const antMessage = message;

  const fetchDetail = useCallback(async () => {
    if (!params.id) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/data-objects/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setDetail(data.data);
        editForm.setFieldsValue({
          name: data.data.name,
          description: data.data.description,
          query_statement: data.data.query_statement,
          primary_key: data.data.primary_key,
          display_template: data.data.display_template,
          sync_enabled: data.data.sync_enabled,
          sync_cron: data.data.sync_cron,
          sync_strategy: data.data.sync_strategy,
          status: data.data.status,
        });
      } else {
        antMessage.error(data.message || '获取详情失败');
      }
    } catch {
      antMessage.error('获取详情失败');
    } finally {
      setLoading(false);
    }
  }, [params.id, editForm, antMessage]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleSync = async () => {
    if (!detail) return;

    setSyncing(true);
    try {
      const response = await fetch(`/api/data-objects/${detail.id}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncStrategy: detail.sync_strategy }),
      });

      const data = await response.json();

      if (data.success) {
        antMessage.success(`同步成功：共${data.data.total}条记录`);
        fetchDetail();
      } else {
        antMessage.error(data.message || '同步失败');
      }
    } catch {
      antMessage.error('同步失败');
    } finally {
      setSyncing(false);
    }
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      setSubmitLoading(true);

      const response = await fetch(`/api/data-objects/${detail?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        antMessage.success('更新成功');
        setEditModalVisible(false);
        fetchDetail();
      } else {
        antMessage.error(data.message || '更新失败');
      }
    } catch {
      antMessage.error('更新失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getSyncStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'running':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      case 'pending':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getSyncStatusText = (status?: string) => {
    switch (status) {
      case 'success': return '成功';
      case 'failed': return '失败';
      case 'running': return '同步中';
      case 'pending': return '等待中';
      default: return '未同步';
    }
  };

  const getTypeColor = (type?: string) => {
    const colors: Record<string, string> = {
      mysql: 'blue',
      mongodb: 'green',
      postgresql: 'cyan',
      oracle: 'orange',
      mssql: 'red',
    };
    return colors[type || ''] || 'default';
  };

  if (loading) {
    return (
      <MainLayout title="数据对象详情">
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" tip="加载中..." />
        </div>
      </MainLayout>
    );
  }

  if (!detail) {
    return (
      <MainLayout title="数据对象详情">
        <Alert type="error" message="数据对象不存在或已删除" showIcon />
      </MainLayout>
    );
  }

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Card>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
            <Descriptions.Item label="名称">{detail.name}</Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>
              {detail.description || '无'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={detail.status === 'active' ? 'green' : 'red'}>
                {detail.status === 'active' ? '启用' : '禁用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(detail.created_at).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'query',
      label: '查询配置',
      children: (
        <Card title="查询配置">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="数据源">
              <Space>
                <Tag color={getTypeColor(detail.data_source?.type)}>
                  {detail.data_source?.type?.toUpperCase()}
                </Tag>
                <Text>{detail.data_source?.name}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="主机">
              {detail.data_source?.host}:{detail.data_source?.port}
            </Descriptions.Item>
            <Descriptions.Item label="数据库">
              {detail.data_source?.database}
            </Descriptions.Item>
            <Descriptions.Item label="查询语句">
              <CodeBlock>{detail.query_statement}</CodeBlock>
            </Descriptions.Item>
            <Descriptions.Item label="主键字段">
              <InlineCode>{detail.primary_key}</InlineCode>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'template',
      label: '显示模板',
      children: (
        <Card title="显示模板配置">
          <Row gutter={24}>
            <Col span={12}>
              <Card size="small" title="当前模板">
                <CodeBlock style={{ fontSize: 16 }}>{detail.display_template}</CodeBlock>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="模板语法">
                <ul style={{ paddingLeft: 20 }}>
                  <li>使用 <InlineCode>{'{{字段名}}'}</InlineCode> 语法插入字段</li>
                  <li>支持嵌套字段：<InlineCode>{'{{user.name}}'}</InlineCode></li>
                  <li>示例：<InlineCode>{'{{name}}({{gender}})'}</InlineCode></li>
                </ul>
              </Card>
            </Col>
          </Row>
        </Card>
      ),
    },
  ];

  return (
    <MainLayout title={`数据对象详情 - ${detail.name}`}>
      <Card style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/data-objects')}
          style={{ marginBottom: 16 }}
        >
          返回列表
        </Button>

        <Row gutter={24} align="middle">
          <Col flex="auto">
            <Space direction="vertical" size={0}>
              <Title level={4} style={{ margin: 0 }}>
                {detail.name}
              </Title>
              <Text type="secondary">{detail.description || '暂无描述'}</Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<SyncOutlined />}
                onClick={handleSync}
                loading={syncing}
                type="primary"
              >
                手动同步
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={() => setEditModalVisible(true)}
              >
                编辑
              </Button>
              <Button
                icon={<FileTextOutlined />}
                onClick={() => router.push(`/data-objects/${detail.id}/records`)}
              >
                查看记录
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="同步状态"
              value={getSyncStatusText(detail.last_sync_status)}
              prefix={getSyncStatusIcon(detail.last_sync_status)}
              valueStyle={{
                color: detail.last_sync_status === 'success' ? '#52c41a' :
                       detail.last_sync_status === 'failed' ? '#ff4d4f' : '#1890ff'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="同步记录数"
              value={detail.record_count}
              suffix="条"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="同步策略"
              value={detail.sync_strategy === 'full' ? '全量同步' : '增量同步'}
              valueStyle={{ fontSize: 16 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="最后同步"
              value={detail.last_sync_at ? new Date(detail.last_sync_at).toLocaleString() : '从未同步'}
              valueStyle={{ fontSize: 14 }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs items={tabItems} />

      <Modal
        title="编辑数据对象"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="query_statement"
            label="查询语句"
            rules={[{ required: true, message: '请输入查询语句' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="primary_key"
            label="主键字段"
            rules={[{ required: true, message: '请输入主键字段' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="display_template"
            label="显示模板"
            rules={[
              { required: true, message: '请输入显示模板' },
              {
                validator: (_, value) => {
                  const validation = validateTemplate(value);
                  if (validation.valid) {
                    return Promise.resolve();
                  }
                  return Promise.reject(validation.message);
                },
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="sync_enabled" label="启用同步" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="sync_cron" label="CRON表达式">
            <Input placeholder="如：0 0 2 * * ?" />
          </Form.Item>

          <Form.Item name="sync_strategy" label="同步策略">
            <Select>
              <Select.Option value="full">全量同步</Select.Option>
              <Select.Option value="incremental">增量同步</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="disabled">禁用</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitLoading}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
}
