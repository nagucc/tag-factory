'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input,
  Select, InputNumber, Switch, Popconfirm, Typography, Row, Col,
  App, message, Tooltip, Drawer, Descriptions, Divider
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, ReloadOutlined, EyeOutlined,
  ExperimentOutlined, CodeOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface DataObject {
  id: number;
  name: string;
}

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface TagRule {
  id: number;
  name: string;
  expression: string;
  data_object_id: number;
  data_object_name?: string;
  tag_id: number;
  tag_name?: string;
  tag_color?: string;
  priority: number;
  enabled: boolean;
  description?: string;
  creator_name?: string;
  created_at: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface TestResult {
  expression: string;
  testData: Record<string, any>;
  result: boolean;
}

export default function TagRulesPage() {
  const [rules, setRules] = useState<TagRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [dataObjects, setDataObjects] = useState<DataObject[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [testDrawerVisible, setTestDrawerVisible] = useState(false);
  const [currentRule, setCurrentRule] = useState<TagRule | null>(null);
  const [searchDataObject, setSearchDataObject] = useState('');
  const [searchEnabled, setSearchEnabled] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testExpression, setTestExpression] = useState('');
  const [testData, setTestData] = useState('{\n  "id": 1,\n  "name": "测试用户",\n  "age": 25,\n  "gender": "男"\n}');
  const { message: msg } = App.useApp();
  const [form] = Form.useForm();

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });
      if (searchDataObject) params.append('dataObjectId', searchDataObject);
      if (searchEnabled !== '') params.append('enabled', searchEnabled);

      const response = await fetch(`/api/tag-rules?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRules(data.data.list);
        setPagination(prev => ({ ...prev, ...data.data.pagination }));
      } else {
        msg.error(data.message || '获取标签规则列表失败');
      }
    } catch {
      msg.error('获取标签规则列表失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, searchDataObject, searchEnabled, msg]);

  const fetchDataObjects = useCallback(async () => {
    try {
      const response = await fetch('/api/data-objects?pageSize=100');
      const data = await response.json();
      if (data.success) {
        setDataObjects(data.data.list);
      }
    } catch {
      console.error('获取数据对象列表失败');
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags?pageSize=1000');
      const data = await response.json();
      if (data.success) {
        setTags(data.data.list || []);
      }
    } catch {
      console.error('获取标签列表失败');
    }
  }, []);

  useEffect(() => {
    fetchDataObjects();
    fetchTags();
  }, [fetchDataObjects, fetchTags]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleTableChange = (newPagination: any) => {
    setPagination(prev => ({ ...prev, page: newPagination.current, pageSize: newPagination.pageSize }));
  };

  const handleCreate = () => {
    setCurrentRule(null);
    setModalVisible(true);
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({ enabled: true, priority: 0 });
    }, 100);
  };

  const handleEdit = (rule: TagRule) => {
    setCurrentRule(rule);
    setModalVisible(true);
    setTimeout(() => {
      form.setFieldsValue({
        name: rule.name,
        expression: rule.expression,
        data_object_id: rule.data_object_id,
        tag_id: rule.tag_id,
        priority: rule.priority,
        enabled: rule.enabled,
        description: rule.description,
      });
    }, 100);
  };

  const handleView = (rule: TagRule) => {
    setCurrentRule(rule);
    setDetailDrawerVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/tag-rules/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        msg.success('标签规则删除成功');
        fetchRules();
      } else {
        msg.error(data.message || '删除失败');
      }
    } catch {
      msg.error('删除失败');
    }
  };

  const handleFormSubmit = async (values: any) => {
    setFormLoading(true);
    try {
      const submitData = {
        name: values.name,
        expression: values.expression,
        data_object_id: values.data_object_id,
        tag_id: values.tag_id,
        priority: values.priority || 0,
        enabled: values.enabled,
        description: values.description,
      };

      const url = currentRule ? `/api/tag-rules/${currentRule.id}` : '/api/tag-rules';
      const method = currentRule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      const data = await response.json();

      if (data.success) {
        msg.success(currentRule ? '标签规则更新成功' : '标签规则创建成功');
        fetchRules();
        setModalVisible(false);
      } else {
        msg.error(data.message || '操作失败');
      }
    } catch {
      msg.error('操作失败');
    } finally {
      setFormLoading(false);
    }
  };

  const handleTest = async () => {
    if (!testExpression.trim()) {
      msg.error('请输入规则表达式');
      return;
    }

    try {
      let testDataObj;
      try {
        testDataObj = JSON.parse(testData);
      } catch {
        msg.error('测试数据格式错误，请输入有效的JSON');
        return;
      }

      const response = await fetch(`/api/tag-rules/${currentRule?.id || 0}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expression: testExpression,
          testData: testDataObj,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult(data.data);
        msg.success(data.message);
      } else {
        msg.error(data.message);
      }
    } catch {
      msg.error('测试失败');
    }
  };

  const openTestDrawer = (rule: TagRule) => {
    setCurrentRule(rule);
    setTestExpression(rule.expression);
    setTestResult(null);
    setTestDrawerVisible(true);
  };

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '规则表达式',
      dataIndex: 'expression',
      key: 'expression',
      render: (text: string) => (
        <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
          {text}
        </code>
      ),
    },
    {
      title: '数据对象',
      dataIndex: 'data_object_name',
      key: 'dataObject',
      render: (text: string, record: TagRule) => (
        <Tag color="blue">{text || record.data_object_id}</Tag>
      ),
    },
    {
      title: '匹配标签',
      dataIndex: 'tag_name',
      key: 'tag',
      render: (text: string, record: TagRule) => (
        <Tag color={record.tag_color || '#1890ff'}>{text || record.tag_id}</Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: number) => <InputNumber value={priority} min={0} disabled style={{ width: 60 }} />,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      key: 'creator',
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TagRule) => (
        <Space size="small">
          <Tooltip title="测试规则">
            <Button
              type="link"
              size="small"
              icon={<ExperimentOutlined />}
              onClick={() => openTestDrawer(record)}
            />
          </Tooltip>
          <Tooltip title="查看详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除"
            description="确定要删除此规则吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const pageContent = (
    <>
      <Card
        title={<><CodeOutlined /> 标签规则管理</>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            添加规则
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="选择数据对象"
                style={{ width: '100%' }}
                value={searchDataObject || undefined}
                onChange={setSearchDataObject}
                allowClear
              >
                {dataObjects.map(ds => (
                  <Option key={ds.id} value={ds.id}>{ds.name}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="状态"
                style={{ width: '100%' }}
                value={searchEnabled || undefined}
                onChange={setSearchEnabled}
                allowClear
              >
                <Option value="true">启用</Option>
                <Option value="false">禁用</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={10}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={fetchRules}>
                  搜索
                </Button>
                <Button icon={<ReloadOutlined />} onClick={fetchRules}>
                  刷新
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={rules}
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
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={currentRule ? '编辑标签规则' : '添加标签规则'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{ enabled: true, priority: 0 }}
        >
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>

          <Form.Item
            name="expression"
            label="规则表达式"
            rules={[{ required: true, message: '请输入规则表达式' }]}
            tooltip="支持JavaScript表达式，如：data.age > 18，data.gender === '男'"
          >
            <TextArea rows={3} placeholder="如：data.age > 18" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="data_object_id"
                label="数据对象"
                rules={[{ required: true, message: '请选择数据对象' }]}
              >
                <Select
                  placeholder="选择数据对象"
                  showSearch
                  optionFilterProp="children"
                >
                  {dataObjects.map(ds => (
                    <Option key={ds.id} value={ds.id}>{ds.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="tag_id"
                label="匹配标签"
                rules={[{ required: true, message: '请选择标签' }]}
              >
                <Select
                  placeholder="选择标签"
                  showSearch
                  optionFilterProp="children"
                >
                  {tags.map(tag => (
                    <Option key={tag.id} value={tag.id}>
                      <Tag color={tag.color}>{tag.name}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="priority"
                label="优先级"
                tooltip="数值越大优先级越高"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="enabled"
                label="启用状态"
                valuePropName="checked"
              >
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="规则描述"
          >
            <TextArea rows={2} placeholder="规则描述（选填）" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={formLoading}>
                {currentRule ? '保存修改' : '创建规则'}
              </Button>
              <Button onClick={() => form.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="规则详情"
        placement="right"
        size={500}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {currentRule && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="规则名称">{currentRule.name}</Descriptions.Item>
            <Descriptions.Item label="规则表达式">
              <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>
                {currentRule.expression}
              </code>
            </Descriptions.Item>
            <Descriptions.Item label="数据对象">
              <Tag color="blue">{currentRule.data_object_name || currentRule.data_object_id}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="匹配标签">
              <Tag color={currentRule.tag_color || '#1890ff'}>
                {currentRule.tag_name || currentRule.tag_id}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="优先级">{currentRule.priority}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={currentRule.enabled ? 'green' : 'red'}>
                {currentRule.enabled ? '启用' : '禁用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建人">{currentRule.creator_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {currentRule.created_at ? new Date(currentRule.created_at).toLocaleString() : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="描述">{currentRule.description || '无'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      <Drawer
        title="测试规则"
        placement="right"
        size={600}
        open={testDrawerVisible}
        onClose={() => setTestDrawerVisible(false)}
        extra={
          <Button type="primary" icon={<ExperimentOutlined />} onClick={handleTest}>
            执行测试
          </Button>
        }
      >
        {currentRule && (
          <>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="规则名称">{currentRule.name}</Descriptions.Item>
                <Descriptions.Item label="匹配标签">
                  <Tag color={currentRule.tag_color || '#1890ff'}>
                    {currentRule.tag_name || currentRule.tag_id}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Divider>规则表达式</Divider>
            <TextArea
              rows={3}
              value={testExpression}
              onChange={(e) => setTestExpression(e.target.value)}
              style={{ marginBottom: 16, fontFamily: 'monospace' }}
            />

            <Divider>测试数据 (JSON格式)</Divider>
            <TextArea
              rows={6}
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              style={{ marginBottom: 16, fontFamily: 'monospace' }}
            />

            {testResult && (
              <>
                <Divider>测试结果</Divider>
                <Card size="small" style={{ background: testResult.result ? '#f6ffed' : '#fff2f0' }}>
                  <ResultText result={testResult.result} />
                  <pre style={{ margin: '8px 0 0 0', fontSize: 12 }}>
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </Card>
              </>
            )}
          </>
        )}
      </Drawer>
    </>
  );

  return <MainLayout title="标签规则管理">{pageContent}</MainLayout>;
}

function ResultText({ result }: { result: boolean }) {
  return (
    <Text strong style={{ color: result ? '#52c41a' : '#ff4d4f', fontSize: 16 }}>
      {result ? '✓ 条件匹配成功' : '✗ 条件不匹配'}
    </Text>
  );
}
