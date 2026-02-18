'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Progress, Typography, Space, Spin, Table, Tag } from 'antd';
import { DashboardOutlined, DesktopOutlined, BankOutlined, DatabaseOutlined, UserOutlined, TagOutlined, FolderOutlined, ClockCircleOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import dayjs from 'dayjs';

const { Text } = Typography;

interface SystemMetrics {
  system: {
    hostname: string;
    platform: string;
    uptime: number;
    cpuCount: number;
  };
  cpu: {
    load1: number;
    load5: number;
    load15: number;
    usagePercent: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  stats: {
    dataSourceCount: number;
    dataObjectCount: number;
    tagCount: number;
    workPlanCount: number;
    userCount: number;
  };
  timestamp: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}天 ${hours}小时 ${minutes}分钟`;
}

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<SystemMetrics[]>([]);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/system/metrics');
      const data = await response.json();
      if (data.success) {
        setMetrics(data.data);
        setHistory(prev => {
          const newHistory = [...prev, data.data];
          if (newHistory.length > 20) {
            return newHistory.slice(-20);
          }
          return newHistory;
        });
      }
    } catch (error) {
      console.error('获取系统指标失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => dayjs(text).format('HH:mm:ss'),
    },
    {
      title: 'CPU使用率',
      dataIndex: ['cpu', 'usagePercent'],
      key: 'cpu',
      render: (percent: number) => (
        <Progress percent={Number(percent.toFixed(1))} size="small" status={percent > 80 ? 'exception' : 'normal'} />
      ),
    },
    {
      title: '内存使用率',
      dataIndex: ['memory', 'usagePercent'],
      key: 'memory',
      render: (percent: number) => (
        <Progress percent={Number(percent.toFixed(1))} size="small" status={percent > 80 ? 'exception' : 'normal'} />
      ),
    },
    {
      title: '负载',
      dataIndex: ['cpu', 'load1'],
      key: 'load',
      render: (_: any, record: SystemMetrics) => 
        `${record.cpu.load1.toFixed(2)} / ${record.system.cpuCount}`,
    },
  ];

  if (loading) {
    return (
      <MainLayout title="系统监控">
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  const pageContent = (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={<><DesktopOutlined /> 系统信息</>} variant="borderless">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">主机名：</Text>
                <Text strong>{metrics?.system.hostname}</Text>
              </div>
              <div>
                <Text type="secondary">平台：</Text>
                <Text strong>{metrics?.system.platform}</Text>
              </div>
              <div>
                <Text type="secondary">运行时间：</Text>
                <Text strong>{metrics?.system.uptime ? formatUptime(metrics.system.uptime) : '-'}</Text>
              </div>
              <div>
                <Text type="secondary">CPU核心数：</Text>
                <Text strong>{metrics?.system.cpuCount}</Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<><DesktopOutlined /> CPU使用情况</>} variant="borderless">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic 
                  title="CPU使用率" 
                  value={metrics?.cpu.usagePercent || 0} 
                  suffix="%" 
                  precision={1}
                  valueStyle={{ color: (metrics?.cpu.usagePercent || 0) > 80 ? '#ff4d4f' : '#3f8600' }}
                />
              </Col>
              <Col span={12}>
                <Statistic title="1分钟负载" value={metrics?.cpu.load1 || 0} precision={2} />
                <Text type="secondary">5分钟: {metrics?.cpu.load5?.toFixed(2)}</Text>
                <br />
                <Text type="secondary">15分钟: {metrics?.cpu.load15?.toFixed(2)}</Text>
              </Col>
            </Row>
            <Progress 
              percent={metrics?.cpu.usagePercent || 0} 
              status={(metrics?.cpu.usagePercent || 0) > 80 ? 'exception' : 'normal'}
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<><BankOutlined /> 内存使用情况</>} variant="borderless">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic 
                  title="内存使用率" 
                  value={metrics?.memory.usagePercent || 0} 
                  suffix="%" 
                  precision={1}
                  valueStyle={{ color: (metrics?.memory.usagePercent || 0) > 80 ? '#ff4d4f' : '#3f8600' }}
                />
              </Col>
              <Col span={12}>
                <Statistic title="已用内存" value={metrics?.memory.used || 0} formatter={() => formatBytes(metrics?.memory.used || 0)} />
                <Text type="secondary">总计: {formatBytes(metrics?.memory.total || 0)}</Text>
              </Col>
            </Row>
            <Progress 
              percent={metrics?.memory.usagePercent || 0} 
              status={(metrics?.memory.usagePercent || 0) > 80 ? 'exception' : 'normal'}
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<><DashboardOutlined /> 系统统计</>} variant="borderless">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="数据源" value={metrics?.stats.dataSourceCount || 0} prefix={<DatabaseOutlined />} />
              </Col>
              <Col span={12}>
                <Statistic title="数据对象" value={metrics?.stats.dataObjectCount || 0} prefix={<FolderOutlined />} />
              </Col>
              <Col span={12}>
                <Statistic title="标签" value={metrics?.stats.tagCount || 0} prefix={<TagOutlined />} />
              </Col>
              <Col span={12}>
                <Statistic title="工作计划" value={metrics?.stats.workPlanCount || 0} prefix={<ClockCircleOutlined />} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title="性能历史" style={{ marginTop: 16 }} variant="borderless">
        <Table
          columns={columns}
          dataSource={history}
          rowKey="timestamp"
          pagination={false}
          size="small"
          scroll={{ x: 600 }}
        />
      </Card>
    </>
  );

  return <MainLayout title="系统监控">{pageContent}</MainLayout>;
}
