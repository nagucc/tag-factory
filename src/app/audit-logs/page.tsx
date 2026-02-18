'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Space, Select, DatePicker, Input, Tag, Modal, Typography, App, Tooltip } from 'antd';
import { ReloadOutlined, ExportOutlined, SearchOutlined, EyeOutlined, FilterOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Text } = Typography;
const { Option } = Select;

interface AuditLog {
  id: number;
  user_id?: number;
  username?: string;
  action: string;
  resource_type: string;
  resource_id?: number;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  status: number;
  created_at: string;
}

const actionMap: Record<string, { color: string; label: string }> = {
  login: { color: 'blue', label: '登录' },
  logout: { color: 'default', label: '登出' },
  create: { color: 'green', label: '创建' },
  update: { color: 'orange', label: '更新' },
  delete: { color: 'red', label: '删除' },
  export: { color: 'purple', label: '导出' },
  import: { color: 'cyan', label: '导入' },
  read: { color: 'default', label: '查看' },
};

const resourceTypeMap: Record<string, string> = {
  'auth': '认证',
  'users': '用户',
  'roles': '角色',
  'permissions': '权限',
  'data-sources': '数据源',
  'data-objects': '数据对象',
  'tags': '标签',
  'tag-groups': '标签分组',
  'tag-applications': '标签应用',
  'tag-rules': '标签规则',
  'work-plans': '工作计划',
  'system': '系统',
};

export default function AuditLogsPage() {
  const { message } = App.useApp();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({
    userId: undefined as number | undefined,
    action: undefined as string | undefined,
    resourceType: undefined as string | undefined,
    status: undefined as number | undefined,
    dateRange: undefined as [string, string] | undefined,
  });
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.current.toString());
      params.append('pageSize', pagination.pageSize.toString());
      if (filters.userId) params.append('userId', filters.userId.toString());
      if (filters.action) params.append('action', filters.action);
      if (filters.resourceType) params.append('resourceType', filters.resourceType);
      if (filters.status !== undefined) params.append('status', filters.status.toString());
      if (filters.dateRange) {
        params.append('startDate', filters.dateRange[0]);
        params.append('endDate', filters.dateRange[1]);
      }

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setLogs(data.data.list);
        setPagination(prev => ({ ...prev, total: data.data.pagination.total }));
      } else {
        message.error(data.message || '获取审计日志失败');
      }
    } catch {
      message.error('获取审计日志失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleTableChange = (pag: any) => {
    setPagination(prev => ({ ...prev, current: pag.current, pageSize: pag.pageSize }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchLogs();
  };

  const handleReset = () => {
    setFilters({
      userId: undefined,
      action: undefined,
      resourceType: undefined,
      status: undefined,
      dateRange: undefined,
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleExport = async (format: string) => {
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId.toString());
      if (filters.action) params.append('action', filters.action);
      if (filters.resourceType) params.append('resourceType', filters.resourceType);
      if (filters.status !== undefined) params.append('status', filters.status.toString());
      if (filters.dateRange) {
        params.append('startDate', filters.dateRange[0]);
        params.append('endDate', filters.dateRange[1]);
      }
      params.append('format', format);

      const response = await fetch(`/api/audit-logs/export?${params.toString()}`);
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        message.success('导出成功');
      } else {
        const data = await response.json();
        if (data.success) {
          const jsonStr = JSON.stringify(data.data, null, 2);
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `audit_logs_${Date.now()}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          message.success('导出成功');
        }
      }
    } catch {
      message.error('导出失败');
    }
  };

  const showDetail = (record: AuditLog) => {
    setCurrentLog(record);
    setDetailVisible(true);
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作用户',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string) => {
        const info = actionMap[action] || { color: 'default', label: action };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '资源类型',
      dataIndex: 'resource_type',
      key: 'resource_type',
      width: 120,
      render: (type: string) => resourceTypeMap[type] || type,
    },
    {
      title: '资源ID',
      dataIndex: 'resource_id',
      key: 'resource_id',
      width: 100,
      render: (id: number) => id || '-',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 140,
      render: (ip: string) => ip || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: number) => (
        <Tag color={status === 1 ? 'success' : 'error'}>
          {status === 1 ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: AuditLog) => (
        <Tooltip title="查看详情">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
          />
        </Tooltip>
      ),
    },
  ];

  const pageContent = (
    <>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="用户ID"
            style={{ width: 120 }}
            value={filters.userId}
            onChange={e => setFilters(f => ({ ...f, userId: e.target.value ? parseInt(e.target.value) : undefined }))}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="操作类型"
            style={{ width: 120 }}
            allowClear
            value={filters.action}
            onChange={v => setFilters(f => ({ ...f, action: v }))}
          >
            {Object.entries(actionMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.label}</Option>
            ))}
          </Select>
          <Select
            placeholder="资源类型"
            style={{ width: 140 }}
            allowClear
            value={filters.resourceType}
            onChange={v => setFilters(f => ({ ...f, resourceType: v }))}
          >
            {Object.entries(resourceTypeMap).map(([key, val]) => (
              <Option key={key} value={key}>{val}</Option>
            ))}
          </Select>
          <Select
            placeholder="状态"
            style={{ width: 100 }}
            allowClear
            value={filters.status}
            onChange={v => setFilters(f => ({ ...f, status: v }))}
          >
            <Option value={1}>成功</Option>
            <Option value={0}>失败</Option>
          </Select>
          <RangePicker
            showTime
            onChange={(dates, dateStrings) => {
              if (dates && dateStrings[0] && dateStrings[1]) {
                setFilters(f => ({ ...f, dateRange: [dateStrings[0], dateStrings[1]] }));
              } else {
                setFilters(f => ({ ...f, dateRange: undefined }));
              }
            }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
          <Button icon={<ExportOutlined />} onClick={() => handleExport('csv')}>
            导出CSV
          </Button>
          <Button icon={<ExportOutlined />} onClick={() => handleExport('json')}>
            导出JSON
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={logs}
        loading={loading}
        rowKey="id"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1000 }}
      />

      <Modal
        title="操作详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {currentLog && (
          <div>
            <p><Text strong>时间：</Text>{dayjs(currentLog.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
            <p><Text strong>操作用户：</Text>{currentLog.username || '-'}</p>
            <p><Text strong>操作类型：</Text>{actionMap[currentLog.action]?.label || currentLog.action}</p>
            <p><Text strong>资源类型：</Text>{resourceTypeMap[currentLog.resource_type] || currentLog.resource_type}</p>
            <p><Text strong>资源ID：</Text>{currentLog.resource_id || '-'}</p>
            <p><Text strong>IP地址：</Text>{currentLog.ip_address || '-'}</p>
            <p><Text strong>用户代理：</Text>{currentLog.user_agent || '-'}</p>
            <p><Text strong>状态：</Text>
              <Tag color={currentLog.status === 1 ? 'success' : 'error'}>
                {currentLog.status === 1 ? '成功' : '失败'}
              </Tag>
            </p>
            {currentLog.details && (
              <div>
                <Text strong>详情：</Text>
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, marginTop: 8 }}>
                  {JSON.stringify(currentLog.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );

  return (
    <MainLayout title="审计日志">
      {pageContent}
    </MainLayout>
  );
}
