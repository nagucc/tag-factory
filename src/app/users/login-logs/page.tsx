'use client';

import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Form, Input, Select, DatePicker, Button, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import MainLayout from '@/components/MainLayout';

interface LoginLog {
  id: number;
  user_id?: number;
  username: string;
  ip_address?: string;
  user_agent?: string;
  status: number;
  fail_reason?: string;
  created_at: string;
}

const { RangePicker } = DatePicker;

export default function LoginLogsPage() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchParams, setSearchParams] = useState({ username: '', status: '' });

  useEffect(() => {
    fetchLogs();
  }, [pagination.current, pagination.pageSize]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        pageSize: pagination.pageSize.toString(),
      });
      if (searchParams.username) params.append('username', searchParams.username);
      if (searchParams.status) params.append('status', searchParams.status);

      const response = await fetch(`/api/users/login-logs?${params}`);
      const data = await response.json();
      if (data.success) {
        setLogs(data.data.list || []);
        setPagination({ ...pagination, total: data.data.pagination.total });
      }
    } catch (error) {
      console.error('获取登录日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: { username?: string; status?: string }) => {
    setSearchParams({ username: values.username || '', status: values.status || '' });
    setPagination({ ...pagination, current: 1 });
    fetchLogs();
  };

  const columns: ColumnsType<LoginLog> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '用户名',
      dataIndex: 'username',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '失败原因',
      dataIndex: 'fail_reason',
    },
    {
      title: '登录时间',
      dataIndex: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
  ];

  return (
    <MainLayout title="登录日志">
      <Card>
        <Form layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
          <Form.Item name="username" label="用户名">
            <Input placeholder="请输入用户名" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" allowClear style={{ width: 120 }}>
              <Select.Option value="1">成功</Select.Option>
              <Select.Option value="0">失败</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              查询
            </Button>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
          }}
        />
      </Card>
    </MainLayout>
  );
}
