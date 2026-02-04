'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Table, Card, Button, Space, Tag, Modal, Form, Input, 
  Select, Popconfirm, Typography, Row, Col, App 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  EyeOutlined, SearchOutlined, ReloadOutlined,
  DatabaseOutlined 
} from '@ant-design/icons';
import DataSourceForm from './DataSourceForm';
import MainLayout from '@/components/MainLayout';

const { Text } = Typography;
const { Option } = Select;

interface DataSource {
  id: number;
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  status: number;
  description?: string;
  last_connection?: string;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function DataSourcesPage() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentDataSource, setCurrentDataSource] = useState<DataSource | null>(null);
  const [searchName, setSearchName] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const { message, modal } = App.useApp();
  const formRef = useRef<any>(null);

  const fetchDataSources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });
      if (searchName) params.append('name', searchName);
      if (searchType) params.append('type', searchType);
      if (searchStatus) params.append('status', searchStatus);

      const response = await fetch(`/api/data-sources?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setDataSources(data.data.list);
        setPagination(prev => ({ ...prev, ...data.data.pagination }));
      } else {
        message.error(data.message || '获取数据源列表失败');
      }
    } catch {
      message.error('获取数据源列表失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, searchName, searchType, searchStatus]);

  useEffect(() => {
    fetchDataSources();
  }, [fetchDataSources]);

  const handleTableChange = (newPagination: any) => {
    setPagination(prev => ({ ...prev, page: newPagination.current, pageSize: newPagination.pageSize }));
  };

  const handleCreate = () => {
    setCurrentDataSource(null);
    setModalVisible(true);
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.resetForm();
      }
    }, 100);
  };

  const handleEdit = (record: DataSource) => {
    setCurrentDataSource(record);
    setModalVisible(true);
  };

  const handleView = (record: DataSource) => {
    setCurrentDataSource(record);
    setDetailVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/data-sources/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        message.success('数据源删除成功');
        fetchDataSources();
      } else {
        message.error(data.message || '删除失败');
      }
    } catch {
      message.error('删除失败');
    }
  };

  const handleStatusChange = async (id: number, status: number) => {
    try {
      const response = await fetch(`/api/data-sources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (data.success) {
        message.success(status === 1 ? '数据源已启用' : '数据源已禁用');
        fetchDataSources();
      } else {
        message.error(data.message || '状态更新失败');
      }
    } catch {
      message.error('状态更新失败');
    }
  };

  const handleFormSubmit = async (values: any) => {
    setFormLoading(true);
    try {
      const url = currentDataSource 
        ? `/api/data-sources/${currentDataSource.id}` 
        : '/api/data-sources';
      const method = currentDataSource ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (data.success) {
        message.success(currentDataSource ? '数据源更新成功' : '数据源创建成功');
        fetchDataSources();
        setModalVisible(false);
      } else {
        message.error(data.message || '操作失败');
      }
    } catch {
      message.error('操作失败');
    } finally {
      setFormLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      mysql: 'blue',
      mongodb: 'green',
      postgresql: 'cyan',
      oracle: 'orange',
      sqlite: 'lime',
      mssql: 'red',
    };
    return colors[type] || 'default';
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '最后连接',
      dataIndex: 'last_connection',
      key: 'last_connection',
      render: (date: string) => date ? new Date(date).toLocaleString() : '从未连接',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: DataSource) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger={record.status === 1}
            onClick={() => handleStatusChange(record.id, record.status === 1 ? 0 : 1)}
          >
            {record.status === 1 ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除此数据源吗？"
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

  const pageContent = (
    <>
      <Card 
        title={<><DatabaseOutlined /> 数据源管理</>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            添加数据源
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="搜索名称"
                prefix={<SearchOutlined />}
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onPressEnter={fetchDataSources}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Select
                placeholder="数据源类型"
                style={{ width: '100%' }}
                value={searchType || undefined}
                onChange={setSearchType}
                allowClear
              >
                <Option value="mysql">MySQL</Option>
                <Option value="mongodb">MongoDB</Option>
                <Option value="postgresql">PostgreSQL</Option>
                <Option value="oracle">Oracle</Option>
                <Option value="mssql">SQL Server</Option>
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
                <Option value="1">启用</Option>
                <Option value="0">禁用</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={9}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={fetchDataSources}>
                  搜索
                </Button>
                <Button icon={<ReloadOutlined />} onClick={fetchDataSources}>
                  刷新
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={dataSources}
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

      <Modal
        title={currentDataSource ? '编辑数据源' : '添加数据源'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <DataSourceForm
          ref={formRef}
          initialValues={currentDataSource}
          onSubmit={handleFormSubmit}
          loading={formLoading}
        />
      </Modal>

      <Modal
        title="数据源详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="edit" type="primary" onClick={() => {
            setDetailVisible(false);
            handleEdit(currentDataSource!);
          }}>
            编辑
          </Button>,
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {currentDataSource && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">名称：</Text>
                <Text strong>{currentDataSource.name}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">类型：</Text>
                <Tag color={getTypeColor(currentDataSource.type)}>
                  {currentDataSource.type.toUpperCase()}
                </Tag>
              </Col>
              <Col span={12}>
                <Text type="secondary">主机地址：</Text>
                <Text>{currentDataSource.host}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">端口：</Text>
                <Text>{currentDataSource.port}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">数据库：</Text>
                <Text>{currentDataSource.database}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">用户名：</Text>
                <Text>{currentDataSource.username}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">状态：</Text>
                <Tag color={currentDataSource.status === 1 ? 'green' : 'red'}>
                  {currentDataSource.status === 1 ? '启用' : '禁用'}
                </Tag>
              </Col>
              <Col span={12}>
                <Text type="secondary">最后连接：</Text>
                <Text>
                  {currentDataSource.last_connection 
                    ? new Date(currentDataSource.last_connection).toLocaleString() 
                    : '从未连接'}
                </Text>
              </Col>
              <Col span={24}>
                <Text type="secondary">描述：</Text>
                <Text>{currentDataSource.description || '无'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">创建时间：</Text>
                <Text>{currentDataSource.created_at ? new Date(currentDataSource.created_at).toLocaleString() : '-'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">更新时间：</Text>
                <Text>{currentDataSource.updated_at ? new Date(currentDataSource.updated_at).toLocaleString() : '-'}</Text>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </>
  );

  return <MainLayout title="数据源管理">{pageContent}</MainLayout>;
}
