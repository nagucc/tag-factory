'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table, Card, Button, Space, Tag, Modal, Form, Input,
  Select, Popconfirm, Typography, Row, Col, App, Badge, Tooltip,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, SearchOutlined, ReloadOutlined,
  SyncOutlined, DatabaseOutlined, FileTextOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';

const { Text } = Typography;
const { Option } = Select;

interface DataSource {
  id: number;
  name: string;
  type: string;
}

interface DataObject {
  id: number;
  name: string;
  description?: string;
  data_source_id: number;
  data_source_name?: string;
  data_source_type?: string;
  display_template: string;
  sync_enabled: boolean;
  sync_strategy: string;
  last_sync_at?: string;
  last_sync_status?: string;
  sync_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function DataObjectsPage() {
  const router = useRouter();
  const [dataObjects, setDataObjects] = useState<DataObject[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchDataSource, setSearchDataSource] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const { message } = App.useApp();

  const fetchDataObjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });
      if (searchName) params.append('name', searchName);
      if (searchDataSource) params.append('dataSourceId', searchDataSource);
      if (searchStatus) params.append('status', searchStatus);

      const response = await fetch(`/api/data-objects?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setDataObjects(data.data.list);
        setPagination(prev => ({ ...prev, ...data.data.pagination }));
      } else {
        message.error(data.message || '获取数据对象列表失败');
      }
    } catch {
      message.error('获取数据对象列表失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, searchName, searchDataSource, searchStatus]);

  const fetchDataSources = useCallback(async () => {
    try {
      const response = await fetch('/api/data-sources?pageSize=100');
      const data = await response.json();
      if (data.success) {
        setDataSources(data.data.list);
      }
    } catch {
      console.error('获取数据源列表失败');
    }
  }, []);

  useEffect(() => {
    fetchDataSources();
  }, [fetchDataSources]);

  useEffect(() => {
    fetchDataObjects();
  }, [fetchDataObjects]);

  const handleTableChange = (newPagination: any) => {
    setPagination(prev => ({ ...prev, page: newPagination.current, pageSize: newPagination.pageSize }));
  };

  const handleViewRecords = (record: DataObject) => {
    router.push(`/data-objects/${record.id}/records`);
  };

  const handleSync = async (record: DataObject) => {
    try {
      const response = await fetch(`/api/data-objects/${record.id}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncStrategy: record.sync_strategy || 'full' }),
      });
      const data = await response.json();

      if (data.success) {
        message.success(`同步成功：共${data.data.total}条记录，新增${data.data.new}条，更新${data.data.updated}条`);
        fetchDataObjects();
      } else {
        message.error(data.message || '同步失败');
      }
    } catch {
      message.error('同步失败');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const response = await fetch(`/api/data-objects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (data.success) {
        message.success(status === 'active' ? '已启用' : '已禁用');
        fetchDataObjects();
      } else {
        message.error(data.message || '状态更新失败');
      }
    } catch {
      message.error('状态更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/data-objects/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        message.success('数据对象删除成功');
        fetchDataObjects();
      } else {
        message.error(data.message || '删除失败');
      }
    } catch {
      message.error('删除失败');
    }
  };

  const getSyncStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'green';
      case 'failed': return 'red';
      case 'running': return 'processing';
      case 'pending': return 'gold';
      default: return 'default';
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

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: DataObject) => (
        <Tooltip title="点击查看详情">
          <Button
            type="link"
            size="small"
            onClick={() => router.push(`/data-objects/${record.id}`)}
            style={{ padding: 0, height: 'auto', fontSize: 14 }}
          >
            {text}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: '数据源',
      key: 'dataSource',
      render: (_: any, record: DataObject) => (
        <Space>
          <Tag color={getTypeColor(record.data_source_type)}>
            {record.data_source_type?.toUpperCase()}
          </Tag>
          <Text>{record.data_source_name}</Text>
        </Space>
      ),
    },
    {
      title: '同步策略',
      dataIndex: 'sync_strategy',
      key: 'sync_strategy',
      render: (strategy: string) => (
        <Tag color={strategy === 'full' ? 'blue' : 'purple'}>
          {strategy === 'full' ? '全量同步' : '增量同步'}
        </Tag>
      ),
    },
    {
      title: '同步状态',
      key: 'syncStatus',
      render: (_: any, record: DataObject) => (
        <Space orientation="vertical" size={0}>
          <Badge status={getSyncStatusColor(record.last_sync_status) as any} text={getSyncStatusText(record.last_sync_status)} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.last_sync_at ? new Date(record.last_sync_at).toLocaleString() : '从未同步'}
          </Text>
        </Space>
      ),
    },
    {
      title: '记录数',
      dataIndex: 'sync_count',
      key: 'sync_count',
      render: (count: number, record: DataObject) => (
        <Tooltip title="点击查看记录列表">
          <Button
            type="link"
            size="small"
            onClick={() => router.push(`/data-objects/${record.id}/records`)}
            style={{ padding: 0, height: 'auto', fontSize: 14 }}
          >
            {count.toLocaleString()}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: DataObject) => (
        <Space size="small">
          <Tooltip title="手动同步">
            <Button
              type="link"
              size="small"
              icon={<SyncOutlined />}
              onClick={() => handleSync(record)}
              loading={record.last_sync_status === 'running'}
            >
              同步
            </Button>
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => router.push(`/data-objects/${record.id}?action=edit`)}
            >
              编辑
            </Button>
          </Tooltip>
          <Popconfirm
            title="确认删除"
            description="确定要删除此数据对象吗？相关数据记录也将被删除。"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout title="数据对象管理">
      <Card
        title={<><DatabaseOutlined /> 数据对象管理</>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/data-objects/create')}>
            创建数据对象
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="搜索名称"
                prefix={<SearchOutlined />}
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onPressEnter={fetchDataObjects}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="选择数据源"
                style={{ width: '100%' }}
                value={searchDataSource || undefined}
                onChange={setSearchDataSource}
                allowClear
              >
                {dataSources.map(ds => (
                  <Option key={ds.id} value={ds.id}>
                    <Tag color={getTypeColor(ds.type)}>{ds.type.toUpperCase()}</Tag>
                    {ds.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="状态"
                style={{ width: '100%' }}
                value={searchStatus || undefined}
                onChange={setSearchStatus}
                allowClear
              >
                <Option value="active">启用</Option>
                <Option value="disabled">禁用</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={fetchDataObjects}>
                  搜索
                </Button>
                <Button icon={<ReloadOutlined />} onClick={fetchDataObjects}>
                  刷新
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={dataObjects}
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
    </MainLayout>
  );
}
