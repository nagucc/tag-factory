'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Form, Select, DatePicker, Button, Space, Table, Tag, Row, Col, Typography, Checkbox, App, InputNumber, Drawer, Empty, Tooltip } from 'antd';
import { SearchOutlined, ExportOutlined, FilterOutlined, ClearOutlined, ReloadOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import dayjs from 'dayjs';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface TagOption {
  id: number;
  name: string;
  code: string;
  color: string;
  type: string;
}

interface QueryResult {
  key: string;
  dataObjectId: number;
  dataObjectName: string;
  recordId: string | null;
  tags: { id: number; name: string; color: string }[];
  appliedBy: number;
  applierName: string;
  appliedAt: string;
  source: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface DataObjectOption {
  id: number;
  name: string;
}

interface FilterState {
  dataObjectId: number | undefined;
  source: string | undefined;
  appliedAtFrom: string | undefined;
  appliedAtTo: string | undefined;
}

export default function TagQueryPage() {
  const [form] = Form.useForm();
  const [tags, setTags] = useState<TagOption[]>([]);
  const [dataObjects, setDataObjects] = useState<DataObjectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [queryLogic, setQueryLogic] = useState<'AND' | 'OR'>('AND');
  const [filters, setFilters] = useState<FilterState>({
    dataObjectId: undefined,
    source: undefined,
    appliedAtFrom: undefined,
    appliedAtTo: undefined,
  });
  const [selectedRecord, setSelectedRecord] = useState<QueryResult | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { message } = App.useApp();

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags?status=1&pageSize=1000');
      const data = await response.json();
      if (data.success) {
        const tagList = data.data.list || [];
        setTags(tagList);
      }
    } catch {
      message.error('获取标签列表失败');
    }
  }, [message]);

  const fetchDataObjects = useCallback(async () => {
    if (dataObjects.length > 0) return;
    try {
      const response = await fetch('/api/data-objects?pageSize=1000');
      const data = await response.json();
      if (data.success) {
        setDataObjects(data.data.list || []);
      }
    } catch {
      message.error('获取数据对象列表失败');
    }
  }, [dataObjects]);

  useEffect(() => {
    fetchTags();
    fetchDataObjects();
  }, [fetchTags, fetchDataObjects]);

  const handleQuery = async (resetPage = true) => {
    if (selectedTags.length === 0) {
      message.warning('请至少选择一个标签');
      return;
    }

    setQueryLoading(true);
    try {
      const currentPage = resetPage ? 1 : pagination.page;
      const values = form.getFieldsValue();

      const requestBody: any = {
        tagIds: selectedTags,
        logic: queryLogic,
        page: currentPage,
        pageSize: pagination.pageSize,
      };

      if (filters.dataObjectId) {
        requestBody.dataObjectId = filters.dataObjectId;
      }
      if (filters.source) {
        requestBody.source = filters.source;
      }
      if (filters.appliedAtFrom && filters.appliedAtTo) {
        requestBody.appliedAtFrom = filters.appliedAtFrom;
        requestBody.appliedAtTo = filters.appliedAtTo;
      }

      const response = await fetch('/api/tags/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        const list = data.data.list || [];
        setResults(list.map((item: any, index: number) => ({
          key: `${item.dataObjectId}-${item.recordId || 'object'}-${index}`,
          dataObjectId: item.dataObjectId,
          dataObjectName: item.dataObjectName,
          recordId: item.recordId,
          tags: item.tags || [],
          appliedBy: item.appliedBy,
          applierName: item.applierName,
          appliedAt: item.appliedAt,
          source: item.source,
        })));
        setPagination(prev => ({
          ...prev,
          page: data.data.pagination?.page || 1,
          pageSize: data.data.pagination?.pageSize || 20,
          total: data.data.pagination?.total || 0,
          totalPages: data.data.pagination?.totalPages || 0,
        }));
      } else {
        message.error(data.message || '查询失败');
      }
    } catch {
      message.error('查询失败');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedTags([]);
    setQueryLogic('AND');
    setFilters({
      dataObjectId: undefined,
      source: undefined,
      appliedAtFrom: undefined,
      appliedAtTo: undefined,
    });
    setResults([]);
    setPagination({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
    form.resetFields();
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    setPagination(prev => ({ ...prev, page, pageSize: pageSize || prev.pageSize }));
    handleQuery(false);
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    if (selectedTags.length === 0) {
      message.warning('请至少选择一个标签');
      return;
    }

    try {
      const values = form.getFieldsValue();

      const requestBody: any = {
        tagIds: selectedTags,
        logic: queryLogic,
        exportFormat: format,
      };

      if (filters.dataObjectId) {
        requestBody.dataObjectId = filters.dataObjectId;
      }
      if (filters.source) {
        requestBody.source = filters.source;
      }
      if (filters.appliedAtFrom && filters.appliedAtTo) {
        requestBody.appliedAtFrom = filters.appliedAtFrom;
        requestBody.appliedAtTo = filters.appliedAtTo;
      }

      const response = await fetch('/api/tags/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tag-export-${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        message.success('导出成功');
      } else {
        const data = await response.json();
        message.error(data.message || '导出失败');
      }
    } catch {
      message.error('导出失败');
    }
  };

  const handleViewDetail = (record: QueryResult) => {
    setSelectedRecord(record);
    setDrawerVisible(true);
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      manual: 'blue',
      auto: 'green',
      import: 'orange',
    };
    return colors[source] || 'default';
  };

  const getSourceText = (source: string) => {
    const texts: Record<string, string> = {
      manual: '手动',
      auto: '自动',
      import: '导入',
    };
    return texts[source] || source;
  };

  const columns = [
    {
      title: '数据对象',
      dataIndex: 'dataObjectName',
      key: 'dataObjectName',
      render: (name: string, record: QueryResult) => (
        <a onClick={() => handleViewDetail(record)}>{name || '未知'}</a>
      ),
    },
    {
      title: '记录ID',
      dataIndex: 'recordId',
      key: 'recordId',
      render: (id: string | null) => id || <Text type="secondary">（对象级）</Text>,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: { id: number; name: string; color: string }[]) => (
        <Space wrap>
          {tags.map((tag) => (
            <Tag key={tag.id} color={tag.color}>{tag.name}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '应用人',
      dataIndex: 'applierName',
      key: 'applierName',
      render: (name: string) => name || '-',
    },
    {
      title: '应用时间',
      dataIndex: 'appliedAt',
      key: 'appliedAt',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => (
        <Tag color={getSourceColor(source)}>{getSourceText(source)}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: QueryResult) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const pageContent = (
    <>
      <Card
        title={<><SearchOutlined /> 标签查询</>}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchTags}>刷新标签</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item label="选择标签">
                <Select
                  mode="multiple"
                  placeholder="请选择要查询的标签"
                  value={selectedTags}
                  onChange={setSelectedTags}
                  maxTagCount={3}
                  showSearch
                  optionFilterProp="children"
                  style={{ width: '100%' }}
                >
                  {tags.map((tag) => (
                    <Option key={tag.id} value={tag.id}>
                      <Space>
                        <Tag color={tag.color}>{tag.name}</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>{tag.code}</Text>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="查询逻辑">
                <Select
                  value={queryLogic}
                  onChange={setQueryLogic}
                  style={{ width: '100%' }}
                >
                  <Option value="AND">AND（同时包含所有标签）</Option>
                  <Option value="OR">OR（包含任一标签）</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="数据对象">
                <Select
                  placeholder="全部"
                  allowClear
                  value={filters.dataObjectId}
                  onChange={(value) => setFilters(prev => ({ ...prev, dataObjectId: value }))}
                  style={{ width: '100%' }}
                  onClick={fetchDataObjects}
                >
                  {dataObjects.map((obj) => (
                    <Option key={obj.id} value={obj.id}>
                      {obj.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="来源">
                <Select
                  placeholder="全部"
                  allowClear
                  value={filters.source}
                  onChange={(value) => setFilters(prev => ({ ...prev, source: value }))}
                  style={{ width: '100%' }}
                >
                  <Option value="manual">手动</Option>
                  <Option value="auto">自动</Option>
                  <Option value="import">导入</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Form.Item label="应用时间范围">
                <RangePicker
                  style={{ width: '100%' }}
                  onChange={(dates, dateStrings) => {
                    setFilters(prev => ({
                      ...prev,
                      appliedAtFrom: dateStrings[0] || undefined,
                      appliedAtTo: dateStrings[1] || undefined,
                    }));
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => handleQuery()}
                loading={queryLoading}
              >
                查询
              </Button>
              <Button icon={<ClearOutlined />} onClick={handleReset}>
                重置
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={() => handleExport('csv')}
                disabled={results.length === 0}
              >
                导出CSV
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleExport('excel')}
                disabled={results.length === 0}
              >
                导出Excel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Text strong>查询结果：</Text>
          <Text> 共找到 </Text>
          <Text strong style={{ color: '#1890ff' }}>{pagination.total}</Text>
          <Text> 条记录</Text>
          {selectedTags.length > 0 && (
            <Text type="secondary" style={{ marginLeft: 16 }}>
              （查询条件：{selectedTags.length}个标签，{queryLogic}逻辑）
            </Text>
          )}
        </div>

        {results.length === 0 ? (
          <Empty description="暂无数据，请设置查询条件后点击查询" />
        ) : (
          <Table
            columns={columns}
            dataSource={results}
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: handlePageChange,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            loading={queryLoading}
            rowKey="key"
          />
        )}
      </Card>

      <Drawer
        title="记录详情"
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        size="large"
      >
        {selectedRecord && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">数据对象：</Text>
                <Text strong>{selectedRecord.dataObjectName}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">记录ID：</Text>
                <Text>{selectedRecord.recordId || '（对象级）'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">应用人：</Text>
                <Text>{selectedRecord.applierName || '-'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">应用时间：</Text>
                <Text>
                  {selectedRecord.appliedAt
                    ? dayjs(selectedRecord.appliedAt).format('YYYY-MM-DD HH:mm:ss')
                    : '-'}
                </Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">来源：</Text>
                <Tag color={getSourceColor(selectedRecord.source)}>
                  {getSourceText(selectedRecord.source)}
                </Tag>
              </Col>
              <Col span={24}>
                <Text type="secondary">标签：</Text>
                <div style={{ marginTop: 8 }}>
                  {selectedRecord.tags.map((tag) => (
                    <Tag key={tag.id} color={tag.color} style={{ marginBottom: 4 }}>
                      {tag.name}
                    </Tag>
                  ))}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Drawer>
    </>
  );

  return <MainLayout title="标签查询">{pageContent}</MainLayout>;
}
