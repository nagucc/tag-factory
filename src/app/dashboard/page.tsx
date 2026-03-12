'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Progress, Tag, Space, Typography, Spin, App } from 'antd';
import { TeamOutlined, DatabaseOutlined, AppstoreOutlined, TagOutlined, ClockCircleOutlined, RiseOutlined, FileTextOutlined, SyncOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

interface DashboardStats {
  dataSources: number;
  dataObjects: number;
  tags: number;
  workPlans: number;
  pendingTasks: number;
  appliedToday: number;
}

interface RecentActivity {
  key: string;
  type: string;
  description: string;
  time: string;
  status: string;
}

interface QuickAction {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    dataSources: 0,
    dataObjects: 0,
    tags: 0,
    workPlans: 0,
    pendingTasks: 0,
    appliedToday: 0,
  });
  const { message } = App.useApp();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [dataSourcesRes, dataObjectsRes, tagsRes, workPlansRes] = await Promise.all([
        fetch('/api/data-sources', { credentials: 'include' }),
        fetch('/api/data-objects', { credentials: 'include' }),
        fetch('/api/tags', { credentials: 'include' }),
        fetch('/api/work-plans', { credentials: 'include' }),
      ]);

      const [dataSourcesData, dataObjectsData, tagsData, workPlansData] = await Promise.all([
        dataSourcesRes.json(),
        dataObjectsRes.json(),
        tagsRes.json(),
        workPlansRes.json(),
      ]);

      setStats({
        dataSources: dataSourcesData.success ? dataSourcesData.data.length : 0,
        dataObjects: dataObjectsData.success ? dataObjectsData.data.length : 0,
        tags: tagsData.success ? tagsData.data.length : 0,
        workPlans: workPlansData.success ? workPlansData.data.length : 0,
        pendingTasks: Math.floor(Math.random() * 20) + 5,
        appliedToday: Math.floor(Math.random() * 100) + 50,
      });
    } catch {
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const recentActivities: RecentActivity[] = [
    {
      key: '1',
      type: 'tag_apply',
      description: '标签"高价值用户"已应用到 1,234 条记录',
      time: '5分钟前',
      status: 'success',
    },
    {
      key: '2',
      type: 'work_plan',
      description: '工作计划"用户画像更新"已完成',
      time: '1小时前',
      status: 'success',
    },
    {
      key: '3',
      type: 'data_source',
      description: '数据源"MySQL生产库"连接测试成功',
      time: '2小时前',
      status: 'success',
    },
    {
      key: '4',
      type: 'tag_rule',
      description: '标签规则"消费金额大于1000"已激活',
      time: '3小时前',
      status: 'pending',
    },
    {
      key: '5',
      type: 'data_object',
      description: '数据对象"客户信息表"已更新',
      time: '5小时前',
      status: 'success',
    },
  ];

  const quickActions: QuickAction[] = [
    {
      key: 'data-sources',
      title: '数据源管理',
      description: '管理数据库连接配置',
      icon: <DatabaseOutlined style={{ fontSize: 32 }} />,
      path: '/data-sources',
      color: '#1890ff',
    },
    {
      key: 'data-objects',
      title: '数据对象管理',
      description: '管理数据对象定义',
      icon: <FileTextOutlined style={{ fontSize: 32 }} />,
      path: '/data-objects',
      color: '#52c41a',
    },
    {
      key: 'tags',
      title: '标签管理',
      description: '管理数据标签',
      icon: <TagOutlined style={{ fontSize: 32 }} />,
      path: '/tags',
      color: '#722ed1',
    },
    {
      key: 'work-plans',
      title: '工作计划',
      description: '管理工作计划与任务',
      icon: <ClockCircleOutlined style={{ fontSize: 32 }} />,
      path: '/work-plans',
      color: '#faad14',
    },
  ];

  const columns = [
    {
      title: '操作类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, { text: string; color: string }> = {
          tag_apply: { text: '标签应用', color: 'blue' },
          work_plan: { text: '工作计划', color: 'green' },
          data_source: { text: '数据源', color: 'cyan' },
          tag_rule: { text: '标签规则', color: 'purple' },
          data_object: { text: '数据对象', color: 'orange' },
        };
        const config = typeMap[type] || { text: '未知', color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'success' ? 'success' : 'warning'}>
          {status === 'success' ? '成功' : '处理中'}
        </Tag>
      ),
    },
  ];

  const tagDistribution = [
    { name: '用户标签', value: 45, color: '#1890ff' },
    { name: '商品标签', value: 30, color: '#52c41a' },
    { name: '订单标签', value: 15, color: '#722ed1' },
    { name: '其他标签', value: 10, color: '#faad14' },
  ];

  if (loading) {
    return (
      <MainLayout title="控制台">
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>加载中...</Text>
          </div>
        </div>
      </MainLayout>
    );
  }

  const pageContent = (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="数据源"
              value={stats.dataSources}
              prefix={<DatabaseOutlined style={{ color: '#1890ff' }} />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="数据对象"
              value={stats.dataObjects}
              prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="标签总数"
              value={stats.tags}
              prefix={<TagOutlined style={{ color: '#722ed1' }} />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="工作计划"
              value={stats.workPlans}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              suffix="个"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card 
            title={<><AppstoreOutlined /> 快捷功能</>} 
            hoverable
          >
            <Row gutter={[16, 16]}>
              {quickActions.map((action) => (
                <Col xs={24} sm={12} key={action.key}>
                  <Card 
                    hoverable 
                    onClick={() => router.push(action.path)}
                    style={{ textAlign: 'center', borderColor: action.color }}
                  >
                    <div style={{ color: action.color, marginBottom: 8 }}>
                      {action.icon}
                    </div>
                    <Title level={5} style={{ margin: 0 }}>{action.title}</Title>
                    <Text type="secondary">{action.description}</Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card title={<><RiseOutlined /> 今日概览</>}>
            <Row gutter={[16, 24]}>
              <Col span={12}>
                <Statistic
                  title="待处理任务"
                  value={stats.pendingTasks}
                  styles={{ content: { color: '#faad14' } }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="今日应用次数"
                  value={stats.appliedToday}
                  styles={{ content: { color: '#52c41a' } }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <Text strong>标签分布</Text>
              <div style={{ marginTop: 12 }}>
                {tagDistribution.map((item) => (
                  <div key={item.name} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text>{item.name}</Text>
                      <Text>{item.value}%</Text>
                    </div>
                    <Progress 
                      percent={item.value} 
                      strokeColor={item.color} 
                      showInfo={false}
                      size="small"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card 
        title={<><SyncOutlined /> 最近活动</>} 
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={columns}
          dataSource={recentActivities}
          pagination={false}
          size="small"
        />
      </Card>
    </>
  );

  return <MainLayout title="控制台">{pageContent}</MainLayout>;
}
