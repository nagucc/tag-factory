'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Typography, Space, Table, Tag, message } from 'antd';
import { UserOutlined, LogoutOutlined, TeamOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
  lastLogin?: string;
}

interface Permission {
  resource: string;
  action: string;
}

export default function HomePage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setUserInfo(data.data.user);
        setPermissions(data.data.permissions.map((p: string) => {
          const [resource, action] = p.split(':');
          return { resource, action };
        }));
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('auth_token');
      message.success('已退出登录');
      router.push('/login');
      router.refresh();
    } catch {
      message.error('退出失败');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Text>加载中...</Text>
      </div>
    );
  }

  const permissionColumns = [
    {
      title: '资源',
      dataIndex: 'resource',
      key: 'resource',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (text: string) => (
        <Tag color={text === 'manage' ? 'gold' : text === 'delete' ? 'red' : 'blue'}>
          {text}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <UserOutlined style={{ fontSize: 24 }} />
            <div>
              <Title level={4} style={{ margin: 0 }}>{userInfo?.username}</Title>
              <Text type="secondary">{userInfo?.email}</Text>
            </div>
            <Tag color="blue">{userInfo?.role}</Tag>
          </Space>
          <Button 
            type="primary" 
            danger 
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </div>
      </Card>

      <Card title={<><TeamOutlined /> 我的权限</>}>
        <Table 
          dataSource={permissions} 
          columns={permissionColumns} 
          rowKey={(record) => `${record.resource}-${record.action}`}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
