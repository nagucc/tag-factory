'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Steps, Form, Input, Select, Card, Button, Space, Alert,
  Table, Typography, Spin, Row, Col, Divider, Tooltip, message, Tag, App,
} from 'antd';
import {
  DatabaseOutlined, FileTextOutlined, EyeOutlined, SyncOutlined,
  CheckCircleOutlined, WarningOutlined, LeftOutlined, RightOutlined,
  QuestionCircleOutlined, ReloadOutlined,
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import {
  parseTemplate,
  renderTemplate,
  getFieldSuggestions,
  validateTemplate,
  previewTemplate,
} from '@/lib/utils/displayTemplate';

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface DataSource {
  id: number;
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
}

interface FieldInfo {
  name: string;
  type: string;
}

export default function CreateDataObjectPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [queryResult, setQueryResult] = useState<any[]>([]);
  const [fields, setFields] = useState<FieldInfo[]>([]);
  const [templatePreview, setTemplatePreview] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [templateValidation, setTemplateValidation] = useState<{ valid: boolean; message?: string }>({ valid: true });
  const [displayTemplateValue, setDisplayTemplateValue] = useState('{{id}}');
  const { message: antMessage } = App.useApp();

  const steps = [
    { title: '选择数据源', icon: <DatabaseOutlined /> },
    { title: '配置查询', icon: <FileTextOutlined /> },
    { title: '设置模板', icon: <EyeOutlined /> },
    { title: '同步策略', icon: <SyncOutlined /> },
  ];

  const fetchDataSources = useCallback(async () => {
    try {
      const response = await fetch('/api/data-sources?pageSize=100&status=1');
      const data = await response.json();
      if (data.success) {
        setDataSources(data.data.list);
      }
    } catch {
      antMessage.error('获取数据源列表失败');
    }
  }, [antMessage]);

  useEffect(() => {
    fetchDataSources();
  }, [fetchDataSources]);

  const handleDataSourceChange = async (dataSourceId: number) => {
    const ds = dataSources.find(d => d.id === dataSourceId);
    setSelectedDataSource(ds || null);
    form.setFieldsValue({ query_statement: '', primary_key: '' });
    setQueryResult([]);
    setFields([]);
    setTemplatePreview([]);
    setQueryError(null);
  };

  const handlePreviewQuery = async () => {
    const dataSourceId = form.getFieldValue('data_source_id');
    const queryStatement = form.getFieldValue('query_statement');

    if (!dataSourceId) {
      antMessage.warning('请选择数据源');
      return;
    }

    if (!queryStatement) {
      antMessage.warning('请输入查询语句');
      return;
    }

    setLoading(true);
    setQueryError(null);

    try {
      const response = await fetch(`/api/data-sources/${dataSourceId}/preview-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query_statement: queryStatement }),
      });
      const data = await response.json();

      if (data.success) {
        setQueryResult(data.data.slice(0, 10));
        extractFieldsFromData(data.data[0]);
      } else {
        setQueryError(data.message || '查询失败');
        setQueryResult([]);
      }
    } catch {
      setQueryError('查询执行失败');
      setQueryResult([]);
    } finally {
      setLoading(false);
    }
  };

  const extractFieldsFromData = (data: any) => {
    if (!data) return;
    
    const fieldList: FieldInfo[] = [];
    
    function traverse(obj: any, prefix: string = '') {
      if (obj === null || obj === undefined) return;
      
      if (Array.isArray(obj)) {
        if (obj.length > 0 && typeof obj[0] === 'object') {
          traverse(obj[0], prefix);
        }
        return;
      }
      
      if (typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
          const fullPath = prefix ? `${prefix}.${key}` : key;
          
          if (value === null || value === undefined) {
            fieldList.push({ name: fullPath, type: 'null' });
          } else if (typeof value === 'object') {
            traverse(value, fullPath);
          } else {
            fieldList.push({ name: fullPath, type: typeof value });
          }
        }
      }
    }
    
    traverse(data);
    setFields(fieldList);
  };

  const handleTemplateChange = (template: string) => {
    setDisplayTemplateValue(template);
    const validation = validateTemplate(template);
    setTemplateValidation(validation);

    if (validation.valid && queryResult.length > 0) {
      const preview = previewTemplate(template, queryResult, 5);
      setTemplatePreview(preview.previews);
    } else {
      setTemplatePreview([]);
    }
  };

  const handleInsertField = (fieldName: string) => {
    const currentTemplate = form.getFieldValue('display_template') || '';
    const newTemplate = currentTemplate + `{{${fieldName}}}`;
    form.setFieldsValue({ display_template: newTemplate });
    handleTemplateChange(newTemplate);
  };

  const handleNext = async () => {
    try {
      const values = await form.validateFields();
      
      if (currentStep === 0) {
        if (!values.data_source_id) {
          antMessage.warning('请选择数据源');
          return;
        }
      }
      
      if (currentStep === 1) {
        if (!values.query_statement || !values.primary_key) {
          antMessage.warning('请完善查询配置');
          return;
        }
        if (!queryResult.length) {
          antMessage.warning('请先执行查询预览');
          return;
        }
      }
      
      if (currentStep === 2) {
        const template = values.display_template;
        const validation = validateTemplate(template);
        if (!validation.valid) {
          antMessage.warning(validation.message || '模板格式不正确');
          return;
        }
      }
      
      setCurrentStep(currentStep + 1);
    } catch {
      // 表单验证失败
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      const values = form.getFieldsValue(true);
      console.log('表单提交数据:', values);

      if (!values.name) {
        antMessage.error('请填写对象名称');
        return;
      }
      if (!values.data_source_id) {
        antMessage.error('请选择数据源');
        return;
      }
      if (!values.query_statement) {
        antMessage.error('请配置查询语句');
        return;
      }
      if (!values.primary_key) {
        antMessage.error('请选择主键字段');
        return;
      }

      await form.validateFields();
      console.log('提交数据验证通过:', {
        name: values.name,
        data_source_id: values.data_source_id,
        query_statement: values.query_statement?.substring(0, 50),
        primary_key: values.primary_key,
      });

      setSubmitLoading(true);

      const response = await fetch('/api/data-objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          sync_enabled: values.sync_enabled || false,
          created_by: 1,
        }),
      });

      const data = await response.json();
      console.log('API响应:', data);

      if (data.success) {
        antMessage.success('数据对象创建成功');
        router.push('/data-objects');
      } else {
        antMessage.error(data.message || `创建失败: ${data.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('提交错误:', error);
      antMessage.error('创建失败，请检查控制台日志');
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card title="选择数据源">
            <Form.Item
              name="data_source_id"
              label="数据源"
              rules={[{ required: true, message: '请选择数据源' }]}
            >
              <Select
                placeholder="请选择数据源"
                onChange={handleDataSourceChange}
                value={selectedDataSource?.id}
              >
                {dataSources.map(ds => (
                  <Option key={ds.id} value={ds.id}>
                    <Space>
                      <Text strong>{ds.name}</Text>
                      <Text type="secondary">({ds.type}://{ds.host}:{ds.port})</Text>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {selectedDataSource && (
              <Card size="small" style={{ marginTop: 16 }}>
                <Row gutter={16}>
                  <Col span={6}>
                    <Text type="secondary">类型</Text>
                    <div><Text strong>{selectedDataSource.type}</Text></div>
                  </Col>
                  <Col span={6}>
                    <Text type="secondary">主机</Text>
                    <div><Text>{selectedDataSource.host}</Text></div>
                  </Col>
                  <Col span={6}>
                    <Text type="secondary">端口</Text>
                    <div><Text>{selectedDataSource.port}</Text></div>
                  </Col>
                  <Col span={6}>
                    <Text type="secondary">数据库</Text>
                    <div><Text>{selectedDataSource.database}</Text></div>
                  </Col>
                </Row>
              </Card>
            )}

            <Form.Item
              name="name"
              label="对象名称"
              rules={[{ required: true, message: '请输入对象名称' }]}
              style={{ marginTop: 16 }}
            >
              <Input placeholder="请输入数据对象名称" />
            </Form.Item>

            <Form.Item name="description" label="描述">
              <TextArea rows={3} placeholder="请输入数据对象描述（可选）" />
            </Form.Item>
          </Card>
        );

      case 1:
        return (
          <Card title="配置查询">
            <Alert
              title="查询说明"
              description={
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>MySQL数据源请输入完整的SELECT查询语句</li>
                  <li>MongoDB数据源请输入集合名称（后续版本支持聚合管道）</li>
                  <li>查询结果将用于后续的字段提取和模板配置</li>
                </ul>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item
              name="query_statement"
              label="查询语句"
              rules={[{ required: true, message: '请输入查询语句' }]}
            >
              <TextArea
                rows={6}
                placeholder={
                  selectedDataSource?.type === 'mysql'
                    ? 'SELECT * FROM table_name WHERE ...'
                    : 'collection_name'
                }
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handlePreviewQuery}
                loading={loading}
              >
                执行查询预览
              </Button>
            </Form.Item>

            {queryError && (
              <Alert
                title="查询失败"
                description={queryError}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {queryResult.length > 0 && (
              <>
                <Divider>查询结果预览（前10条）</Divider>
                <Table
                  dataSource={queryResult.slice(0, 5)}
                  rowKey={(record) => {
                    const id = (record as any).id ?? (record as any)._id ?? JSON.stringify(record);
                    return `row-${id}`;
                  }}
                  size="small"
                  pagination={false}
                  scroll={{ x: true }}
                  columns={fields.slice(0, 5).map(field => ({
                    title: field.name,
                    dataIndex: field.name,
                    key: field.name,
                    ellipsis: true,
                  }))}
                />
              </>
            )}

            <Form.Item
              name="primary_key"
              label="主键字段"
              rules={[{ required: true, message: '请选择或输入主键字段' }]}
              style={{ marginTop: 16 }}
              tooltip="用于唯一标识每条记录的字段，将作为数据对象的主键"
            >
              <Select
                placeholder="请选择主键字段"
                showSearch
                optionFilterProp="children"
              >
                {fields.map(f => (
                  <Option key={f.name} value={f.name}>
                    <Space>
                      <Text>{f.name}</Text>
                      <Text type="secondary">({f.type})</Text>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Card>
        );

      case 2:
        return (
          <Card title="设置显示模板">
            <Alert
              title="模板语法说明"
              description={
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>使用 <Text code>{'{{字段名}}'}</Text> 语法插入字段值</li>
                  <li>支持嵌套字段，如：<Text code>{'{{user.name}}'}</Text></li>
                  <li>示例：<Text code>{'{{name}}({{gender}})'}</Text> 将渲染为 "张三(男)"</li>
                </ul>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Row gutter={16}>
              <Col span={12}>
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
                  <TextArea
                    rows={4}
                    placeholder="{{name}}({{gender}})"
                    onChange={(e) => handleTemplateChange(e.target.value)}
                  />
                </Form.Item>

                <Form.Item label="可用字段">
                  <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid #d9d9d9', padding: 8, borderRadius: 4 }}>
                    {fields.map(f => (
                      <Tooltip key={f.name} title="点击插入">
                        <Button
                          size="small"
                          style={{ margin: 2 }}
                          onClick={() => handleInsertField(f.name)}
                        >
                          {f.name}
                        </Button>
                      </Tooltip>
                    ))}
                  </div>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Card size="small" title="预览效果" style={{ height: '100%' }}>
                  {templatePreview.length > 0 ? (
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      {templatePreview.map((preview, index) => (
                        <li key={index}>
                          <Text code>{preview}</Text>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Text type="secondary">在左侧输入模板后将在此预览</Text>
                  )}
                </Card>
              </Col>
            </Row>
          </Card>
        );

      case 3:
        return (
          <Card title="配置同步策略">
            <Form.Item
              name="sync_enabled"
              label="自动同步"
              valuePropName="checked"
              tooltip="启用后系统将自动按CRON表达式定时同步数据"
            >
              <Select placeholder="是否启用自动同步">
                <Option value={false}>禁用同步</Option>
                <Option value={true}>启用同步</Option>
              </Select>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.sync_enabled !== currentValues.sync_enabled
              }
            >
              {({ getFieldValue }) => {
                const syncEnabled = getFieldValue('sync_enabled');
                if (!syncEnabled) return null;

                return (
                  <>
                    <Form.Item
                      name="sync_cron"
                      label="CRON表达式"
                      tooltip="定时任务的执行周期，例如：0 0 2 * * ? 表示每天凌晨2点执行"
                      rules={[{ required: true, message: '请输入CRON表达式' }]}
                    >
                      <Input placeholder="秒 分 时 日 月 周 (如：0 0 2 * * ?)" />
                    </Form.Item>

                    <Form.Item
                      name="sync_strategy"
                      label="同步策略"
                      tooltip="全量同步每次获取全部数据，增量同步只获取变更数据"
                    >
                      <Select>
                        <Option value="full">
                          <Space>
                            <Text>全量同步</Text>
                            <Text type="secondary">（每次同步获取全部数据）</Text>
                          </Space>
                        </Option>
                        <Option value="incremental">
                          <Space>
                            <Text>增量同步</Text>
                            <Text type="secondary">（每次同步只获取新增/变更数据）</Text>
                          </Space>
                        </Option>
                      </Select>
                    </Form.Item>
                  </>
                );
              }}
            </Form.Item>

            <Divider />
            
            <Card size="small" title="配置摘要">
              <Form.Item label="数据对象名称">
                <Text strong>{form.getFieldValue('name')}</Text>
              </Form.Item>
              <Form.Item label="数据源">
                <Text>{selectedDataSource?.name}</Text>
              </Form.Item>
              <Form.Item label="显示模板">
                <Text code>{form.getFieldValue('display_template')}</Text>
              </Form.Item>
              <Form.Item label="同步策略">
                <Tag color={form.getFieldValue('sync_strategy') === 'full' ? 'blue' : 'purple'}>
                  {form.getFieldValue('sync_strategy') === 'full' ? '全量同步' : '增量同步'}
                </Tag>
              </Form.Item>
            </Card>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout title="创建数据对象">
      <Card>
        <Steps current={currentStep} items={steps} style={{ marginBottom: 32 }} />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            sync_enabled: false,
            sync_strategy: 'full',
            display_template: '{{id}}',
          }}
        >
          {renderStepContent()}
        </Form>

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => router.back()}>
            取消
          </Button>
          <Space>
            {currentStep > 0 && (
              <Button onClick={handlePrev}>
                上一步
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            ) : (
              <Button type="primary" onClick={handleSubmit} loading={submitLoading}>
                创建数据对象
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </MainLayout>
  );
}
