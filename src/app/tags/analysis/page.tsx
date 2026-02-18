'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Typography, Statistic, Select, DatePicker, Button, Space, Table, Tag, App, Spin, Empty, Progress, Tooltip } from 'antd';
import { BarChartOutlined, LineChartOutlined, PieChartOutlined, ReloadOutlined, ArrowUpOutlined, ArrowDownOutlined, LinkOutlined, InfoCircleOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { Column, Pie, Line } from '@ant-design/charts';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface UsageStats {
  tag_id: number;
  tag_name: string;
  tag_code: string;
  tag_type: string;
  tag_color: string;
  application_count: number;
}

interface DistributionStats {
  tag_id?: number;
  tag_name?: string;
  tag_type?: string;
  tag_color?: string;
  label?: string;
  value: number;
  percentage?: number;
}

interface TrendData {
  date_label: string;
  tag_type?: string;
  application_count: number;
  tag_count?: number;
}

interface TrendSummary {
  total_applications: number;
  total_tags: number;
  total_data_objects: number;
  first_application: string;
  latest_application: string;
}

interface CooccurrenceData {
  tag1_id: number;
  tag1_name: string;
  tag1_color: string;
  tag2_id: number;
  tag2_name: string;
  tag2_color: string;
  cooccurrence_count: number;
}

interface TagStat {
  tag_id: number;
  total_applications: number;
  unique_records: number;
}

export default function TagAnalysisPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('usage');
  const [period, setPeriod] = useState('7days');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [usageData, setUsageData] = useState<UsageStats[]>([]);
  const [distributionData, setDistributionData] = useState<DistributionStats[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [trendSummary, setTrendSummary] = useState<TrendSummary | null>(null);
  const [cooccurrenceData, setCooccurrenceData] = useState<CooccurrenceData[]>([]);
  const [tagStats, setTagStats] = useState<TagStat[]>([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const { message } = App.useApp();

  const fetchStats = useCallback(async (tab?: string) => {
    const currentTab = tab || activeTab;
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('type', currentTab === 'cooccurrence' ? 'cooccurrence' : (currentTab === 'trends' ? 'trends' : 'distribution'));
      
      if (currentTab === 'trends') {
        params.append('period', period);
      }
      
      if (dateRange) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
      }

      if (currentTab === 'usage') {
        params.append('groupBy', 'tag');
        const usageRes = await fetch(`/api/tags/stats?type=usage&groupBy=tag`);
        const usageData = await usageRes.json();
        if (usageData.success) {
          setUsageData(usageData.data.results || []);
          setTotalApplications(usageData.data.totalApplications || 0);
        }
        
        params.set('groupBy', 'type');
        const distRes = await fetch(`/api/tags/stats?${params.toString()}`);
        const distData = await distRes.json();
        if (distData.success) {
          setDistributionData(distData.data.results || []);
        }
      } else if (currentTab === 'trends') {
        const trendsRes = await fetch(`/api/tags/stats?type=trends&period=${period}`);
        const trendsData = await trendsRes.json();
        if (trendsData.success) {
          setTrendData(trendsData.data.results || []);
          setTrendSummary(trendsData.data.summary || null);
        }
      } else if (currentTab === 'distribution') {
        params.append('groupBy', 'tag');
        const distRes = await fetch(`/api/tags/stats?${params.toString()}`);
        const distData = await distRes.json();
        if (distData.success) {
          setDistributionData(distData.data.results || []);
        }
      } else if (currentTab === 'cooccurrence') {
        const coocRes = await fetch('/api/tags/stats?type=cooccurrence&minCooccurrence=2');
        const coocData = await coocRes.json();
        if (coocData.success) {
          setCooccurrenceData(coocData.data.results || []);
          setTagStats(coocData.data.tagStats || []);
        }
      }
    } catch {
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  }, [activeTab, period, dateRange, message]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    fetchStats(tab);
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
  };

  const usageColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '标签',
      key: 'tag',
      render: (_: any, record: UsageStats) => (
        <Space>
          <Tag color={record.tag_color}>{record.tag_name}</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.tag_code}</Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'tag_type',
      key: 'tag_type',
      render: (type: string) => (
        <Tag>{type}</Tag>
      ),
    },
    {
      title: '应用次数',
      dataIndex: 'application_count',
      key: 'application_count',
      sorter: (a: UsageStats, b: UsageStats) => b.application_count - a.application_count,
      render: (count: number) => (
        <Text strong>{count}</Text>
      ),
    },
    {
      title: '占比',
      key: 'percentage',
      render: (_: any, record: UsageStats) => {
        const pct = totalApplications > 0 ? (record.application_count / totalApplications * 100).toFixed(1) : '0';
        return (
          <Progress 
            percent={parseFloat(pct)} 
            size="small" 
            status="normal"
            format={() => `${pct}%`}
          />
        );
      },
    },
  ];

  const cooccurrenceColumns = [
    {
      title: '标签组合',
      key: 'tags',
      render: (_: any, record: CooccurrenceData) => (
        <Space>
          <Tag color={record.tag1_color}>{record.tag1_name}</Tag>
          <Text>+</Text>
          <Tag color={record.tag2_color}>{record.tag2_name}</Tag>
        </Space>
      ),
    },
    {
      title: '共现次数',
      dataIndex: 'cooccurrence_count',
      key: 'cooccurrence_count',
      sorter: (a: CooccurrenceData, b: CooccurrenceData) => b.cooccurrence_count - a.cooccurrence_count,
      render: (count: number) => (
        <Text strong style={{ color: '#1890ff' }}>{count}</Text>
      ),
    },
  ];

  const pieConfig = {
    data: distributionData.map((item: any) => ({
      type: item.tag_name || item.label || item.group_value,
      value: item.value || item.application_count || item.count,
    })),
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      content: (data: any) => `${data.type}: ${((data.percent || 0) * 100).toFixed(1)}%`,
    },
    legend: {
      position: 'bottom',
    },
    statistic: {
      title: {
        content: '总计',
      },
      content: {
        content: distributionData.reduce((sum: number, item: any) => sum + (item.value || 0), 0).toString(),
      },
    },
  };

  const trendConfig = {
    data: trendData.map((item: any) => ({
      date: item.date_label,
      type: item.tag_type || '全部',
      count: item.application_count,
    })),
    xField: 'date',
    yField: 'count',
    seriesField: 'type',
    smooth: true,
    legend: {
      position: 'top',
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.type,
        value: `${datum.count} 次`,
      }),
    },
  };

  const topTagsConfig = {
    data: usageData.slice(0, 10).map((item: any) => ({
      name: item.tag_name,
      count: item.application_count,
      color: item.tag_color,
    })),
    xField: 'count',
    yField: 'name',
    seriesField: 'name',
    layout: 'vertical',
    legend: {
      position: 'top-left',
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.name,
        value: `${datum.count} 次`,
      }),
    },
    label: {
      position: 'right',
      formatter: (datum: any) => `${datum.count}`,
    },
  };

  const statsCards = (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="总应用次数"
            value={totalApplications}
            prefix={<LinkOutlined />}
            styles={{ content: { color: '#1890ff' } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="活跃标签数"
            value={usageData.length}
            prefix={<Tag />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="分布类型数"
            value={distributionData.length}
            prefix={<PieChartOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="共现组合数"
            value={cooccurrenceData.length}
            prefix={<LinkOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );

  const pageContent = (
    <>
      <Card
        title={<><BarChartOutlined /> 标签分析仪表盘</>}
        extra={
          <Space>
            <Select value={period} onChange={handlePeriodChange} style={{ width: 120 }}>
              <Option value="7days">最近7天</Option>
              <Option value="30days">最近30天</Option>
              <Option value="90days">最近90天</Option>
              <Option value="12months">最近12个月</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={() => fetchStats()}>
              刷新
            </Button>
          </Space>
        }
      >
        {statsCards}

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="标签使用排行（Top 10）" loading={loading}>
              {usageData.length > 0 ? (
                <Table
                  dataSource={usageData.slice(0, 10)}
                  columns={usageColumns}
                  rowKey="tag_id"
                  pagination={false}
                  size="small"
                />
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="标签分布" loading={loading}>
              {distributionData.length > 0 ? (
                <div style={{ height: 300 }}>
                  <Pie {...pieConfig} />
                </div>
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24}>
            <Card 
              title="标签应用趋势"
              loading={loading}
              extra={
                <Select value={period} onChange={handlePeriodChange} style={{ width: 120 }}>
                  <Option value="7days">7天</Option>
                  <Option value="30days">30天</Option>
                  <Option value="90days">90天</Option>
                </Select>
              }
            >
              {trendData.length > 0 ? (
                <div style={{ height: 300 }}>
                  <Line {...trendConfig} />
                </div>
              ) : (
                <Empty description="暂无趋势数据" />
              )}
              {trendSummary && (
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col xs={24} sm={6}>
                    <Statistic title="总应用次数" value={trendSummary.total_applications || 0} />
                  </Col>
                  <Col xs={24} sm={6}>
                    <Statistic title="涉及标签数" value={trendSummary.total_tags || 0} />
                  </Col>
                  <Col xs={24} sm={6}>
                    <Statistic title="涉及数据对象" value={trendSummary.total_data_objects || 0} />
                  </Col>
                  <Col xs={24} sm={6}>
                    <Text type="secondary">
                      {trendSummary.first_application 
                        ? `最早: ${dayjs(trendSummary.first_application).format('YYYY-MM-DD')}`
                        : '暂无数据'}
                    </Text>
                  </Col>
                </Row>
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={16}>
            <Card title="标签共现关系" loading={loading}>
              {cooccurrenceData.length > 0 ? (
                <Table
                  dataSource={cooccurrenceData.slice(0, 20)}
                  columns={cooccurrenceColumns}
                  rowKey={(record) => `${record.tag1_id}-${record.tag2_id}`}
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              ) : (
                <Empty description="暂无共现数据（需要至少2个标签同时应用才有共现关系）" />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="标签应用频率" loading={loading}>
              {tagStats.length > 0 ? (
                <Table
                  dataSource={tagStats.slice(0, 10)}
                  columns={[
                    {
                      title: '标签ID',
                      dataIndex: 'tag_id',
                      key: 'tag_id',
                    },
                    {
                      title: '应用次数',
                      dataIndex: 'total_applications',
                      key: 'total_applications',
                      sorter: (a: TagStat, b: TagStat) => b.total_applications - a.total_applications,
                    },
                    {
                      title: '独立记录',
                      dataIndex: 'unique_records',
                      key: 'unique_records',
                    },
                  ]}
                  rowKey="tag_id"
                  pagination={false}
                  size="small"
                />
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </Col>
        </Row>
      </Card>
    </>
  );

  return <MainLayout title="标签分析">{pageContent}</MainLayout>;
}
