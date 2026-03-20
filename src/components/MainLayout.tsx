'use client';

import React, { useEffect, useState } from 'react';
import { Layout, Typography, Space, Button, Tag, App, Avatar, Dropdown, Menu } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, DownOutlined, DatabaseOutlined, TagOutlined, FileTextOutlined, ClockCircleOutlined, SearchOutlined, BarChartOutlined, AuditOutlined, TeamOutlined, MonitorOutlined, HomeOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface Permission {
  resource: string;
  action: string;
}

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

function MainLayout({ children, title }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
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

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      handleLogout();
    } else if (key === 'profile') {
      message.info('个人中心功能开发中');
    } else if (key.startsWith('/')) {
      router.push(key);
    }
  };

  const navMenuItems = [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: '控制台',
    },
    {
      key: 'data',
      icon: <DatabaseOutlined />,
      label: '数据管理',
      children: [
        {
          key: '/data-sources',
          icon: <DatabaseOutlined />,
          label: '数据源',
        },
        {
          key: '/data-objects',
          icon: <FileTextOutlined />,
          label: '数据对象',
        },
      ],
    },
    {
      key: 'tags',
      icon: <TagOutlined />,
      label: '标签管理',
      children: [
        {
          key: '/tags',
          icon: <TagOutlined />,
          label: '标签列表',
        },
        {
          key: '/tags/query',
          icon: <SearchOutlined />,
          label: '标签查询',
        },
        {
          key: '/tags/analysis',
          icon: <BarChartOutlined />,
          label: '标签分析',
        },
      ],
    },
    {
      key: 'work',
      icon: <ClockCircleOutlined />,
      label: '工作管理',
      children: [
        {
          key: '/work-plans',
          icon: <ClockCircleOutlined />,
          label: '工作计划',
        },
        {
          key: '/tag-rules',
          icon: <ClockCircleOutlined />,
          label: '标签规则',
        },
      ],
    },
  ];

  const handleNavClick = ({ key }: { key: string }) => {
    if (key.startsWith('/')) {
      router.push(key);
    }
  };

  const getSelectedKeys = () => {
    const keys: string[] = [];
    if (pathname === '/dashboard') {
      keys.push('/dashboard');
    }
    if (pathname.startsWith('/data-')) {
      keys.push('data');
    }
    if (pathname.startsWith('/tags/')) {
      keys.push('tags');
    }
    if (pathname.startsWith('/work-') || pathname.startsWith('/tag-rules')) {
      keys.push('work');
    }
    return keys;
  };

  const isAdmin = userInfo?.role === 'admin';

  const getUserMenuItems = () => {
    const items = [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人中心',
      },
    ];

    if (isAdmin) {
      items.push({
        key: 'system-management',
        icon: <SettingOutlined />,
        label: '系统管理',
        children: [
          {
            key: '/users',
            icon: <UserOutlined />,
            label: '用户管理',
          },
          {
            key: '/users/login-logs',
            icon: <AuditOutlined />,
            label: '登录日志',
          },
          {
            key: '/roles',
            icon: <TeamOutlined />,
            label: '角色管理',
          },
          {
            key: '/audit-logs',
            icon: <AuditOutlined />,
            label: '操作日志',
          },
          {
            key: '/monitoring',
            icon: <MonitorOutlined />,
            label: '系统监控',
          },
          {
            key: '/system',
            icon: <SettingOutlined />,
            label: '系统设置',
          },
        ],
      } as any);
    }

    items.push(
      {
        key: 'divider',
        type: 'divider',
      } as any,
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        danger: true,
      } as any
    );

    return items;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f0f2f5'
      }}>
        <Text>加载中...</Text>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 24px',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title level={4} style={{ margin: '16px 0', color: '#1890ff', cursor: 'pointer', marginRight: 24 }} onClick={() => router.push('/dashboard')}>
            Tag Factory
          </Title>
          <Menu
            mode="horizontal"
            selectedKeys={getSelectedKeys()}
            items={navMenuItems}
            onClick={handleNavClick}
            style={{ borderBottom: 'none', minWidth: 400 }}
          />
        </div>
        
        <Space size="large">
          <Dropdown 
            menu={{ 
              items: getUserMenuItems(),
              onClick: handleUserMenuClick
            }}
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <Text strong>{userInfo?.username}</Text>
              <Tag color="blue">{userInfo?.role}</Tag>
              <DownOutlined />
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <Content style={{ padding: '24px 50px', background: '#f0f2f5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {children}
        </div>
      </Content>

      <Footer style={{ 
        textAlign: 'center', 
        background: '#fff',
        padding: '24px 50px',
        marginTop: 'auto',
      }}>
        <Text type="secondary">
          Tag Factory ©2026 数据对象标签管理应用
        </Text>
      </Footer>
    </Layout>
  );
}

export default MainLayout;
