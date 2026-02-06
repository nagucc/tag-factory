'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card, Table, Button, Space, Tag, Typography, Row, Col, Spin,
  Drawer, Descriptions, Badge, message,
} from 'antd';
import {
  ArrowLeftOutlined, ReloadOutlined, EyeOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { renderTemplate } from '@/lib/utils/displayTemplate';

const { Text, Title } = Typography;

interface DataObjectInfo {
  id: number;
  name: string;
  display_template: string;
  primary_key: string;
}

interface RecordItem {
  id: number;
  record_id: string;
  data: Record<string, any>;
  tags: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  _synced_at: string;
  _sync_status: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface DataResponse {
  display_template: string;
  primary_key: string;
  list: RecordItem[];
  pagination: Pagination;
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

function Divider({ type }: { type: 'vertical' | 'horizontal' }) {
  return <div style={{ width: 1, height: 20, background: '#d9d9d9', display: 'inline-block', margin: '0 8px' }} />;
}

export default function DataRecordsPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [dataObject, setDataObject] = useState<DataObjectInfo | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<RecordItem | null>(null);
  const antMessage = message;

  const fetchRecords = useCallback(async () => {
    if (!params.id) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/data-objects/${params.id}/records?page=${pagination.page}&pageSize=${pagination.pageSize}`
      );
      const data = await response.json();

      if (data.success) {
        const responseData = data.data as DataResponse;
        setDataObject({
          id: params.id as unknown as number,
          name: `数据对象 #${params.id}`,
          display_template: responseData.display_template || '{{id}}',
          primary_key: responseData.primary_key || 'id',
        });
        setRecords(responseData.list);
        setPagination(prev => ({ ...prev, ...responseData.pagination }));
      } else {
        antMessage.error(data.message || '获取记录列表失败');
      }
    } catch {
      antMessage.error('获取记录列表失败');
    } finally {
      setLoading(false);
    }
  }, [params.id, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleTableChange = (newPagination: any) => {
    setPagination(prev => ({ ...prev, page: newPagination.current, pageSize: newPagination.pageSize }));
  };

  const handleViewDetail = (record: RecordItem) => {
    setCurrentRecord(record);
    setDetailDrawerVisible(true);
  };

  const handleBack = () => {
    router.push('/data-objects');
  };

  const renderDisplayText = (record: RecordItem) => {
    if (!dataObject) return record.record_id;
    try {
      return renderTemplate(dataObject.display_template, record.data);
    } catch {
      return record.record_id;
    }
  };

  const flattenData = (obj: any, prefix = ''): Record<string, any> => {
    const result: Record<string, any> = {};
    
    if (obj === null || obj === undefined) {
      return result;
    }

    if (Array.isArray(obj)) {
      result['[数组]'] = obj.length + ' 项';
      return result;
    }

    if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (value === null || value === undefined) {
          result[fullKey] = null;
        } else if (typeof value === 'object') {
          Object.assign(result, flattenData(value, fullKey));
        } else {
          result[fullKey] = value;
        }
      }
    }
    
    return result;
  };

  const columns = [
    {
      title: '显示名称',
      key: 'display',
      render: (_: any, record: RecordItem) => (
        <Text strong style={{ fontSize: 14 }}>
          {renderDisplayText(record)}
        </Text>
      ),
    },
    {
      title: '标签',
      key: 'tags',
      width: 200,
      render: (_: any, record: RecordItem) => (
        <Space wrap>
          {record.tags.length > 0 ? (
            record.tags.map(tag => (
              <Tag key={tag.id} color={tag.color}>
                {tag.name}
              </Tag>
            ))
          ) : (
            <Text type="secondary">暂无标签</Text>
          )}
        </Space>
      ),
    },
    {
      title: '同步时间',
      dataIndex: '_synced_at',
      key: '_synced_at',
      width: 180,
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '状态',
      dataIndex: '_sync_status',
      key: '_sync_status',
      width: 100,
      render: (status: string) => (
        <Badge status={status === 'active' ? 'success' : 'default'} text={status === 'active' ? '有效' : '已移除'} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: RecordItem) => (
        <Tooltip title="查看详情">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
        </Tooltip>
      ),
    },
  ];

  if (loading && !dataObject) {
    return (
      <MainLayout title="数据记录">
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" tip="加载中..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`数据记录 - ${dataObject?.name}`}>
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              style={{ marginRight: 16 }}
            >
              返回
            </Button>
            <Title level={4} style={{ margin: 0, display: 'inline-block' }}>
              数据记录列表
            </Title>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchRecords}
              loading={loading}
            >
              刷新
            </Button>
          </Col>
        </Row>
      </Card>

      <Card>
        {dataObject && (
          <div style={{ marginBottom: 16 }}>
            <Space split={<Divider type="vertical" />}>
              <Text type="secondary">显示模板：</Text>
              <InlineCode>{dataObject.display_template}</InlineCode>
              <Text type="secondary">主键字段：</Text>
              <InlineCode>{dataObject.primary_key}</InlineCode>
            </Space>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={records}
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
          scroll={{ x: 800 }}
        />
      </Card>

      <Drawer
        title="记录详情"
        placement="right"
        width={600}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {currentRecord && (
          <>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">显示名称</Text>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>
                      {renderDisplayText(currentRecord)}
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">记录ID</Text>
                  <div>
                    <InlineCode>{currentRecord.record_id}</InlineCode>
                  </div>
                </Col>
              </Row>
            </Card>

            {currentRecord.tags.length > 0 && (
              <Card size="small" title="标签" style={{ marginBottom: 16 }}>
                <Space wrap>
                  {currentRecord.tags.map(tag => (
                    <Tag key={tag.id} color={tag.color} style={{ margin: 4 }}>
                      <TagsOutlined /> {tag.name}
                    </Tag>
                  ))}
                </Space>
              </Card>
            )}

            <Card size="small" title="同步信息" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="同步时间">
                  {currentRecord._synced_at ? new Date(currentRecord._synced_at).toLocaleString() : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Badge
                    status={currentRecord._sync_status === 'active' ? 'success' : 'default'}
                    text={currentRecord._sync_status === 'active' ? '有效' : '已移除'}
                  />
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="完整数据">
              <Descriptions column={1} size="small">
                {Object.entries(flattenData(currentRecord.data)).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    {value === null ? (
                      <Text type="secondary">NULL</Text>
                    ) : (
                      <InlineCode>{String(value)}</InlineCode>
                    )}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Card>
          </>
        )}
      </Drawer>
    </MainLayout>
  );
}

function Tooltip({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <span title={title} style={{ cursor: 'pointer' }}>
      {children}
    </span>
  );
}
