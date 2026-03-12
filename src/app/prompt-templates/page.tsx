'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Typography, Row, Col,
  App, message, Modal, Form, Input, Select, Popconfirm, Badge
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  RobotOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Text, Title } = Typography;

interface PromptTemplate {
  id: number;
  name: string;
  category: string | null;
  prompt: string;
  description: string | null;
  is_preset: boolean;
  use_count: number;
  created_by: number | null;
  creator?: {
    id: number;
    username: string;
    name: string;
  };
  created_at: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function PromptTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [categories, setCategories] = useState<string[]>([]);
  const [searchCategory, setSearchCategory] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { message: msg } = App.useApp();

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('pageSize', pagination.pageSize.toString());
      if (searchCategory) {
        params.append('category', searchCategory);
      }

      const response = await fetch(`/api/prompt-templates?${params}`);
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data.list || []);
        setPagination(prev => ({ ...prev, ...data.data.pagination }));
        setCategories(data.data.categories || []);
      }
    } catch {
      msg.error('获取提示词模板失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, searchCategory, msg]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = () => {
    setEditingTemplate(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: PromptTemplate) => {
    setEditingTemplate(record);
    form.setFieldsValue({
      name: record.name,
      category: record.category,
      prompt: record.prompt,
      description: record.description,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/prompt-templates/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        msg.success('模板删除成功');
        fetchTemplates();
      } else {
        msg.error(data.message || '删除失败');
      }
    } catch {
      msg.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const url = editingTemplate
        ? `/api/prompt-templates/${editingTemplate.id}`
        : '/api/prompt-templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (data.success) {
        msg.success(editingTemplate ? '模板更新成功' : '模板创建成功');
        setModalVisible(false);
        fetchTemplates();
      } else {
        msg.error(data.message || '操作失败');
      }
    } catch {
      msg.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTableChange = (pag: any) => {
    setPagination(prev => ({ ...prev, page: pag.current, pageSize: pag.pageSize }));
  };

  const columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: PromptTemplate) => (
        <Space>
          <Text strong>{name}</Text>
          {record.is_preset && <Badge count="预设" style={{ backgroundColor: '#52c41a' }} />}
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string | null) => category ? <Tag>{category}</Tag> : '-',
    },
    {
      title: '提示词内容',
      dataIndex: 'prompt',
      key: 'prompt',
      ellipsis: true,
      render: (prompt: string) => (
        <Text type="secondary" style={{ maxWidth: 300, display: 'block' }}>
          {prompt.substring(0, 100)}{prompt.length > 100 ? '...' : ''}
        </Text>
      ),
    },
    {
      title: '使用次数',
      dataIndex: 'use_count',
      key: 'use_count',
      width: 100,
      render: (count: number) => <Text>{count}</Text>,
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 120,
      render: (creator: any) => creator?.name || creator?.username || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: PromptTemplate) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.is_preset}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个模板吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
            disabled={record.is_preset}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record.is_preset}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const presetTemplates = [
    {
      name: '客户分类',
      category: '分类',
      prompt: '根据用户的消费金额进行分类：消费金额大于1000为VIP客户，消费金额在100-1000之间为普通客户，消费金额小于100为潜在客户',
      description: '根据消费金额自动分类客户',
    },
    {
      name: '情绪分析',
      category: '分析',
      prompt: '根据用户反馈内容进行情绪分析：positive（正面）、negative（负面）、neutral（中性）',
      description: '分析文本内容的情绪倾向',
    },
    {
      name: '优先级判定',
      category: '判定',
      prompt: '根据工单的紧急程度和影响范围判定优先级：P1（紧急重要）、P2（重要）、P3（一般）、P4（低）',
      description: '自动判定工单优先级',
    },
  ];

  const handleCreatePreset = async (template: typeof presetTemplates[0]) => {
    try {
      const response = await fetch('/api/prompt-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          is_preset: true,
        }),
      });
      const data = await response.json();
      if (data.success) {
        msg.success('预设模板添加成功');
        fetchTemplates();
      } else {
        msg.error(data.message || '添加失败');
      }
    } catch {
      msg.error('添加失败');
    }
  };

  return (
    <MainLayout title="提示词模板管理">
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Select
                placeholder="选择分类"
                allowClear
                value={searchCategory}
                onChange={setSearchCategory}
                style={{ width: 150 }}
                options={categories.map(c => ({ label: c, value: c }))}
              />
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              新建模板
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={templates}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Card style={{ marginTop: 16 }} title="预设模板">
        <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
          点击添加按钮将预设模板复制到您的模板库中
        </Text>
        <Row gutter={16}>
          {presetTemplates.map((template, index) => (
            <Col span={8} key={index}>
              <Card
                size="small"
                title={
                  <Space>
                    <RobotOutlined />
                    <Text strong>{template.name}</Text>
                  </Space>
                }
                extra={
                  <Button
                    type="link"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => handleCreatePreset(template)}
                  >
                    添加
                  </Button>
                }
              >
                <Text type="secondary">{template.description}</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag>{template.category}</Tag>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Modal
        title={editingTemplate ? '编辑模板' : '新建模板'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText="确认"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
          >
            <Select
              placeholder="选择或输入分类"
              allowClear
              options={[
                { label: '分类', value: '分类' },
                { label: '分析', value: '分析' },
                { label: '判定', value: '判定' },
                { label: '提取', value: '提取' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="prompt"
            label="提示词内容"
            rules={[{ required: true, message: '请输入提示词内容' }]}
          >
            <Input.TextArea
              rows={6}
              placeholder="请输入提示词内容"
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea
              rows={2}
              placeholder="请输入描述（可选）"
            />
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
}
