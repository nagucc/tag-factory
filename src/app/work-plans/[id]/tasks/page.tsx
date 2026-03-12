'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card, Table, Button, Space, Tag, Typography, Row, Col,
  App, message, Progress, Drawer, Descriptions, Tabs, List,
  Checkbox, Popconfirm, Badge, Tooltip, Statistic, Spin, Avatar, Modal,
  InputNumber, Select, Empty, Divider, Input
} from 'antd';
import {
  ArrowLeftOutlined, ReloadOutlined, CheckCircleOutlined,
  ClockCircleOutlined, TagsOutlined, UserOutlined,
  SyncOutlined, UndoOutlined, EyeOutlined, RobotOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { renderTemplate } from '@/lib/utils/displayTemplate';

const { Text, Title } = Typography;

interface WorkPlanInfo {
  id: number;
  name: string;
  description?: string;
  data_object_id: number;
  display_template?: string;
  primary_key?: string;
  status: string;
  total_records: number;
  tagged_records: number;
  progress: number;
}

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface WorkPlanRecord {
  id: number;
  record_id: string;
  data: Record<string, any>;
  status: string;
  tag_id?: number;
  tag?: Tag;
  tagged_by?: number;
  tagger?: { id: number; username: string };
  tagged_at?: string;
  created_at: string;
}

interface Member {
  id: number;
  user_id: number;
  username: string;
  role: string;
  tagged_count: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function WorkPlanTasksPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [workPlan, setWorkPlan] = useState<WorkPlanInfo | null>(null);
  const [pendingRecords, setPendingRecords] = useState<WorkPlanRecord[]>([]);
  const [taggedRecords, setTaggedRecords] = useState<WorkPlanRecord[]>([]);
  const [skippedRecords, setSkippedRecords] = useState<WorkPlanRecord[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [pendingPagination, setPendingPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [taggedPagination, setTaggedPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [skippedPagination, setSkippedPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [batchTagModalVisible, setBatchTagModalVisible] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [batchTagging, setBatchTagging] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<WorkPlanRecord | null>(null);
  const { message: msg } = App.useApp();
  const [activeTab, setActiveTab] = useState('pending');

  const [aiTagModalVisible, setAiTagModalVisible] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiPageSize, setAiPageSize] = useState(50);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreviewResults, setAiPreviewResults] = useState<any[]>([]);
  const [aiPreviewLoading, setAiPreviewLoading] = useState(false);
  const [tagDistribution, setTagDistribution] = useState<Record<number, number>>({});

  const workPlanId = params?.id as string;

  const fetchWorkPlan = useCallback(async () => {
    if (!workPlanId) return;
    try {
      const response = await fetch(`/api/work-plans/${workPlanId}`);
      const data = await response.json();
      if (data.success) {
        const wp = data.data;
        setWorkPlan({
          ...wp,
          display_template: wp.dataObject?.display_template || '{{id}}',
          primary_key: wp.dataObject?.primary_key || 'id',
        });
      }
    } catch (error) {
      console.error('获取工作计划失败:', error);
    }
  }, [workPlanId]);

  const fetchAvailableTags = useCallback(async () => {
    if (!workPlanId) return;
    try {
      const response = await fetch(`/api/work-plans/${workPlanId}/tags`);
      const data = await response.json();
      if (data.success) {
        setAvailableTags(data.data || []);
      }
    } catch {
      console.error('获取可用标签失败');
    }
  }, [workPlanId, msg]);

  const fetchMembers = useCallback(async () => {
    if (!workPlanId) return;
    try {
      const response = await fetch(`/api/work-plans/${workPlanId}/members`);
      const data = await response.json();
      if (data.success) {
        setMembers(data.data || []);
      }
    } catch {
      console.error('获取成员失败');
    }
  }, [workPlanId, msg]);

  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setUserInfo(data.data.user);
      }
    } catch {
      console.error('获取用户信息失败');
    }
  }, []);

  const fetchPendingRecords = useCallback(async () => {
    if (!workPlanId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/work-plans/${workPlanId}/records?status=pending&page=1&pageSize=${pendingPagination.pageSize}`
      );
      const data = await response.json();
      if (data.success) {
        setPendingRecords(data.data.list);
        setPendingPagination(prev => ({ ...prev, ...data.data.pagination }));
      }
    } catch {
      msg.error('获取待打标记录失败');
    } finally {
      setLoading(false);
    }
  }, [workPlanId, pendingPagination.pageSize, msg]);

  const fetchTaggedRecords = useCallback(async () => {
    if (!workPlanId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/work-plans/${workPlanId}/records?status=tagged&page=1&pageSize=${taggedPagination.pageSize}`
      );
      const data = await response.json();
      if (data.success) {
        setTaggedRecords(data.data.list);
        setTaggedPagination(prev => ({ ...prev, ...data.data.pagination }));
      }
    } catch {
      msg.error('获取已打标记录失败');
    } finally {
      setLoading(false);
    }
  }, [workPlanId, taggedPagination.pageSize, msg]);

  const fetchSkippedRecords = useCallback(async () => {
    if (!workPlanId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/work-plans/${workPlanId}/records?status=skipped&page=1&pageSize=${skippedPagination.pageSize}`
      );
      const data = await response.json();
      if (data.success) {
        setSkippedRecords(data.data.list);
        setSkippedPagination(prev => ({ ...prev, ...data.data.pagination }));
      }
    } catch {
      msg.error('获取跳过记录失败');
    } finally {
      setLoading(false);
    }
  }, [workPlanId, skippedPagination.pageSize, msg]);

  const syncRecords = useCallback(async () => {
    if (!workPlanId) return;
    try {
      msg.loading('正在同步数据...', 0);
      const response = await fetch(`/api/work-plans/${workPlanId}/sync-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncStrategy: 'incremental' }),
      });
      msg.destroy();
      const data = await response.json();
      if (data.success) {
        msg.success(data.message);
        fetchPendingRecords();
        fetchTaggedRecords();
        fetchSkippedRecords();
      } else {
        msg.error(data.message || '同步失败');
      }
    } catch {
      msg.error('同步失败');
    }
  }, [workPlanId, fetchPendingRecords, fetchTaggedRecords, fetchSkippedRecords, msg]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  useEffect(() => {
    if (userInfo) {
      fetchWorkPlan();
      fetchAvailableTags();
      fetchMembers();
      fetchPendingRecords();
      fetchSkippedRecords();
    }
  }, [userInfo, fetchWorkPlan, fetchAvailableTags, fetchMembers, fetchPendingRecords, fetchSkippedRecords]);

  const handleTagRecord = async (recordId: string, tagId: number) => {
    if (!workPlanId || !userInfo) return;
    try {
      const response = await fetch(`/api/work-plans/${workPlanId}/records/${recordId}/tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record_id: recordId,
          tag_id: tagId,
          user_id: userInfo.id,
        }),
      });
      const data = await response.json();
      if (data.success) {
        msg.success('打标成功');
        fetchPendingRecords();
        fetchTaggedRecords();
        fetchSkippedRecords();
        fetchMembers();
      } else {
        msg.error(data.message || '打标失败');
      }
    } catch {
      msg.error('打标失败');
    }
  };

  const handleRemoveTag = async (recordId: string) => {
    if (!workPlanId || !userInfo) return;
    try {
      const response = await fetch(`/api/work-plans/${workPlanId}/records/${recordId}/tag?user_id=${userInfo.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        msg.success('标签已移除');
        fetchPendingRecords();
        fetchTaggedRecords();
        fetchSkippedRecords();
        fetchMembers();
      } else {
        msg.error(data.message || '移除失败');
      }
    } catch {
      msg.error('移除失败');
    }
  };

  const handleSkipRecord = async (recordId: string) => {
    if (!workPlanId || !userInfo) return;
    try {
      const response = await fetch(`/api/work-plans/${workPlanId}/records/${recordId}/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userInfo.id,
        }),
      });
      const data = await response.json();
      if (data.success) {
        msg.success('已标记为跳过');
        fetchPendingRecords();
        fetchTaggedRecords();
        fetchSkippedRecords();
        fetchMembers();
      } else {
        msg.error(data.message || '操作失败');
      }
    } catch {
      msg.error('操作失败');
    }
  };

  const handleBatchTag = async () => {
    if (!workPlanId || !userInfo || !selectedTagId || selectedRecordIds.length === 0) return;

    setBatchTagging(true);
    try {
      const response = await fetch(`/api/work-plans/${workPlanId}/batch-tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record_ids: selectedRecordIds,
          tag_id: selectedTagId,
          user_id: userInfo.id,
        }),
      });
      const data = await response.json();
      if (data.success) {
        msg.success(`成功为 ${data.data.successCount} 条记录打标`);
        setSelectedRecordIds([]);
        setSelectedTagId(null);
        setBatchTagModalVisible(false);
        fetchPendingRecords();
        fetchTaggedRecords();
        fetchSkippedRecords();
        fetchMembers();
      } else {
        msg.error(data.message || '批量打标失败');
      }
    } catch {
      msg.error('批量打标失败');
    } finally {
      setBatchTagging(false);
    }
  };

  const handleAIPreview = async () => {
    if (!workPlanId || !aiPrompt) {
      msg.warning('请输入打标提示词');
      return;
    }

    setAiPreviewLoading(true);
    setAiPreviewResults([]);
    setTagDistribution({});
    try {
      const response = await fetch(`/api/work-plans/${workPlanId}/ai-tag-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          page_size: aiPageSize,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAiPreviewResults(data.data.recommendations || []);
        setTagDistribution(data.data.tag_distribution || {});
        msg.success(`AI分析完成，共 ${data.data.total} 条记录，分 ${data.data.batches} 批处理`);
      } else {
        msg.error(data.message || 'AI打标预览失败');
      }
    } catch {
      msg.error('AI打标预览失败');
    } finally {
      setAiPreviewLoading(false);
    }
  };

  const handleAIExecute = async () => {
    if (!workPlanId || !userInfo || aiPreviewResults.length === 0) {
      msg.warning('请先进行AI打标预览');
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch(`/api/work-plans/${workPlanId}/ai-tag-execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          page_size: aiPageSize,
          preview_results: aiPreviewResults,
          user_id: userInfo.id,
        }),
      });
      const data = await response.json();
      if (data.success) {
        msg.success(data.message || 'AI批量打标完成');
        setAiTagModalVisible(false);
        setAiPrompt('');
        setAiPreviewResults([]);
        setTagDistribution({});
        fetchPendingRecords();
        fetchTaggedRecords();
        fetchSkippedRecords();
        fetchMembers();
      } else {
        msg.error(data.message || 'AI批量打标执行失败');
      }
    } catch {
      msg.error('AI批量打标执行失败');
    } finally {
      setAiLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/work-plans');
  };

  const handleViewDetail = (record: WorkPlanRecord) => {
    setCurrentRecord(record);
    setDetailDrawerVisible(true);
  };

  const renderDisplayText = (record: WorkPlanRecord) => {
    if (!workPlan) return record.record_id;
    try {
      return renderTemplate(workPlan.display_template || '{{id}}', record.data);
    } catch {
      return record.record_id;
    }
  };

  const handleTableChange = (pagination: Pagination, type: string) => {
    if (type === 'pending') {
      setPendingPagination(prev => ({ ...prev, ...pagination }));
    } else if (type === 'tagged') {
      setTaggedPagination(prev => ({ ...prev, ...pagination }));
    } else if (type === 'skipped') {
      setSkippedPagination(prev => ({ ...prev, ...pagination }));
    }
  };

  const flattenData = (obj: any, prefix = ''): Record<string, any> => {
    const result: Record<string, any> = {};
    if (obj === null || obj === undefined) return result;
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

  const pendingColumns = [
    {
      title: <Checkbox onChange={(e) => {
        if (e.target.checked) {
          setSelectedRecordIds(pendingRecords.map(r => r.record_id));
        } else {
          setSelectedRecordIds([]);
        }
      }} />,
      key: 'checkbox',
      width: 50,
      render: (_: any, record: WorkPlanRecord) => (
        <Checkbox
          checked={selectedRecordIds.includes(record.record_id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRecordIds([...selectedRecordIds, record.record_id]);
            } else {
              setSelectedRecordIds(selectedRecordIds.filter(id => id !== record.record_id));
            }
          }}
        />
      ),
    },
    {
      title: '显示名称',
      key: 'display',
      render: (_: any, record: WorkPlanRecord) => (
        <Button type="link" onClick={() => handleViewDetail(record)}>
          <Text strong style={{ fontSize: 14 }}>{renderDisplayText(record)}</Text>
        </Button>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: WorkPlanRecord) => (
        <Space wrap>
          {availableTags.map(tag => (
            <Button
              key={tag.id}
              size="small"
              type="primary"
              onClick={() => handleTagRecord(record.record_id, tag.id)}
            >
              <TagsOutlined /> {tag.name}
            </Button>
          ))}
          <Button
            size="small"
            onClick={() => handleSkipRecord(record.record_id)}
          >
            <EyeOutlined /> 跳过
          </Button>
        </Space>
      ),
    },
  ];

  const taggedColumns = [
    {
      title: '显示名称',
      key: 'display',
      render: (_: any, record: WorkPlanRecord) => (
        <Button type="link" onClick={() => handleViewDetail(record)}>
          <Text strong style={{ fontSize: 14 }}>{renderDisplayText(record)}</Text>
        </Button>
      ),
    },
    {
      title: '已选标签',
      key: 'tag',
      render: (_: any, record: WorkPlanRecord) => (
        record.tag ? (
          <Tag color={record.tag.color}>
            <TagsOutlined /> {record.tag.name}
          </Tag>
        ) : <Text type="secondary">-</Text>
      ),
    },
    {
      title: '打标人',
      key: 'tagger',
      render: (_: any, record: WorkPlanRecord) => (
        record.tagger ? (
          <Space>
            <UserOutlined />
            <Text>{record.tagger.username}</Text>
          </Space>
        ) : <Text type="secondary">-</Text>
      ),
    },
    {
      title: '打标时间',
      dataIndex: 'tagged_at',
      key: 'tagged_at',
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: WorkPlanRecord) => (
        <Popconfirm
          title="确认移除"
          description="确定要移除此标签吗？只能移除自己打的标签。"
          onConfirm={() => handleRemoveTag(record.record_id)}
          okText="确认"
          cancelText="取消"
          disabled={record.tagged_by !== userInfo?.id}
        >
          <Button
            size="small"
            danger
            icon={<UndoOutlined />}
            disabled={record.tagged_by !== userInfo?.id}
          >
            移除标签
          </Button>
        </Popconfirm>
      ),
    },
  ];

  if (loading && !workPlan) {
    return (
      <MainLayout title="任务执行">
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
          <p style={{ marginTop: 16, color: '#999' }}>加载中...</p>
        </div>
      </MainLayout>
    );
  }

  const tabItems = [
    {
      key: 'pending',
      label: (
        <Badge count={pendingPagination.total} offset={[10, 0]}>
          <span><ClockCircleOutlined /> 待打标</span>
        </Badge>
      ),
      children: (
        <>
          {selectedRecordIds.length > 0 && (
            <div style={{ marginBottom: 16, padding: 16, background: '#f6ffed', borderRadius: 8 }}>
              <Space>
                <Text strong>已选择 {selectedRecordIds.length} 条记录</Text>
                <Button
                  type="primary"
                  onClick={() => setBatchTagModalVisible(true)}
                >
                  批量打标
                </Button>
                <Button onClick={() => setSelectedRecordIds([])}>
                  取消选择
                </Button>
              </Space>
            </div>
          )}
          <Table
            columns={pendingColumns}
            dataSource={pendingRecords}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pendingPagination.page,
              pageSize: pendingPagination.pageSize,
              total: pendingPagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            onChange={(p) => handleTableChange(p as Pagination, 'pending')}
            scroll={{ x: 500 }}
          />
        </>
      ),
    },
    {
      key: 'tagged',
      label: (
        <Badge count={taggedPagination.total} offset={[10, 0]} style={{ backgroundColor: '#52c41a' }}>
          <span><CheckCircleOutlined /> 已打标</span>
        </Badge>
      ),
      children: (
        <Table
          columns={taggedColumns}
          dataSource={taggedRecords}
          rowKey="id"
          loading={loading}
          pagination={{
            current: taggedPagination.page,
            pageSize: taggedPagination.pageSize,
            total: taggedPagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={(p) => handleTableChange(p as Pagination, 'tagged')}
          scroll={{ x: 800 }}
        />
      ),
    },
    {
      key: 'skipped',
      label: (
        <Badge count={skippedPagination.total} offset={[10, 0]} style={{ backgroundColor: '#faad14' }}>
          <span><EyeOutlined /> 已跳过</span>
        </Badge>
      ),
      children: (
        <Table
          columns={taggedColumns}
          dataSource={skippedRecords}
          rowKey="id"
          loading={loading}
          pagination={{
            current: skippedPagination.page,
            pageSize: skippedPagination.pageSize,
            total: skippedPagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={(p) => handleTableChange(p as Pagination, 'skipped')}
          scroll={{ x: 800 }}
        />
      ),
    },
    {
      key: 'members',
      label: <span><UserOutlined /> 成员统计</span>,
      children: (
        <List
          dataSource={members}
          renderItem={(member) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                  <Space>
                    <Text strong>{member.username}</Text>
                    <Tag color={member.role === 'owner' ? 'gold' : 'blue'}>
                      {member.role === 'owner' ? '负责人' : '成员'}
                    </Tag>
                  </Space>
                }
                description={`已打标 ${member.tagged_count} 条记录`}
              />
              <Progress
                type="circle"
                percent={workPlan?.total_records ? Math.round((member.tagged_count / workPlan.total_records) * 100) : 0}
                size={40}
              />
            </List.Item>
          )}
        />
      ),
    },
  ];

  return (
    <MainLayout title={`任务执行 - ${workPlan?.name || ''}`}>
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
              {workPlan?.name}
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<RobotOutlined />}
                onClick={() => setAiTagModalVisible(true)}
              >
                AI批量打标
              </Button>
              <Button
                icon={<SyncOutlined />}
                onClick={syncRecords}
                loading={loading}
              >
                同步数据
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  if (activeTab === 'pending') fetchPendingRecords();
                  else fetchTaggedRecords();
                }}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={24}>
          <Col span={6}>
            <Statistic
              title="总记录数"
              value={pendingPagination.total + taggedPagination.total + skippedPagination.total}
              prefix={<TagsOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已完成"
              value={taggedPagination.total + skippedPagination.total}
              styles={{ content: { color: '#52c41a' } }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="待打标"
              value={pendingPagination.total}
              styles={{ content: { color: '#faad14' } }}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Progress
              type="circle"
              percent={
                pendingPagination.total + taggedPagination.total + skippedPagination.total > 0
                  ? Math.round(((taggedPagination.total + skippedPagination.total) / (pendingPagination.total + taggedPagination.total + skippedPagination.total)) * 100)
                  : 0
              }
              strokeColor={taggedPagination.total + skippedPagination.total === pendingPagination.total + taggedPagination.total + skippedPagination.total && pendingPagination.total + taggedPagination.total + skippedPagination.total > 0 ? '#52c41a' : undefined}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      <Modal
        title="批量打标"
        open={batchTagModalVisible}
        onCancel={() => {
          setBatchTagModalVisible(false);
          setSelectedTagId(null);
        }}
        onOk={handleBatchTag}
        confirmLoading={batchTagging}
        okText="确认打标"
        cancelText="取消"
      >
        <p>已选择 <Text strong>{selectedRecordIds.length}</Text> 条记录</p>
        <p>请选择要应用的标签：</p>
        <Space wrap>
          {availableTags.map(tag => (
            <Button
              key={tag.id}
              type={selectedTagId === tag.id ? 'primary' : 'default'}
              onClick={() => setSelectedTagId(tag.id)}
            >
              <Tag color={tag.color}>{tag.name}</Tag>
            </Button>
          ))}
        </Space>
      </Modal>

      <Modal
        title={<><RobotOutlined /> AI智能批量打标</>}
        open={aiTagModalVisible}
        onCancel={() => {
          setAiTagModalVisible(false);
          setAiPrompt('');
          setAiPreviewResults([]);
          setTagDistribution({});
        }}
        width={900}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <Text strong>打标提示词：</Text>
            <Input.TextArea
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="请输入打标提示词，例如：根据用户的消费金额进行分类，高于1000为VIP客户，低于100为普通客户"
              style={{ marginTop: 8 }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>每页记录数：</Text>
            <InputNumber
              min={10}
              max={100}
              value={aiPageSize}
              onChange={(value) => setAiPageSize(value || 50)}
              style={{ marginLeft: 8, width: 120 }}
            />
            <Text type="secondary" style={{ marginLeft: 8 }}>（建议10-100条）</Text>
          </div>
          <Space>
            <Button
              type="primary"
              onClick={handleAIPreview}
              loading={aiPreviewLoading}
              icon={<RobotOutlined />}
            >
              AI预览
            </Button>
            <Button
              onClick={() => {
                setAiTagModalVisible(false);
                setAiPrompt('');
                setAiPreviewResults([]);
                setTagDistribution({});
              }}
            >
              取消
            </Button>
          </Space>
        </div>

        {aiPreviewResults.length > 0 && (
          <>
            <Divider>AI推荐结果</Divider>
            <div style={{ marginBottom: 16 }}>
              <Text>标签分布：</Text>
              <Space wrap style={{ marginTop: 8 }}>
                {Object.entries(tagDistribution).map(([tagId, count]) => {
                  const tag = availableTags.find(t => t.id === parseInt(tagId));
                  return tag ? (
                    <Tag key={tagId} color={tag.color}>
                      {tag.name}: {count}
                    </Tag>
                  ) : null;
                })}
              </Space>
            </div>
            <Table
              dataSource={aiPreviewResults.slice(0, 20)}
              rowKey="record_id"
              size="small"
              pagination={false}
              scroll={{ y: 300 }}
              columns={[
                {
                  title: '记录ID',
                  dataIndex: 'record_id',
                  key: 'record_id',
                  width: 150,
                },
                {
                  title: '推荐标签',
                  key: 'tag',
                  render: (_: any, record: any) => (
                    record.tag_id ? (
                      <Tag color={record.tag_color}>
                        {record.tag_name || '未知标签'}
                      </Tag>
                    ) : (
                      <Text type="secondary">无法确定</Text>
                    )
                  ),
                },
                {
                  title: '置信度',
                  dataIndex: 'confidence',
                  key: 'confidence',
                  render: (val: number) => (
                    <Text type={val >= 0.7 ? 'success' : val >= 0.4 ? 'warning' : 'danger'}>
                      {Math.round(val * 100)}%
                    </Text>
                  ),
                },
                {
                  title: '推荐理由',
                  dataIndex: 'reason',
                  key: 'reason',
                  ellipsis: true,
                },
              ]}
            />
            {aiPreviewResults.length > 20 && (
              <Text type="secondary">显示前20条结果，共 {aiPreviewResults.length} 条</Text>
            )}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button
                type="primary"
                size="large"
                onClick={handleAIExecute}
                loading={aiLoading}
                icon={<TagsOutlined />}
              >
                确认执行打标 ({aiPreviewResults.length} 条)
              </Button>
            </div>
          </>
        )}

        {aiPreviewLoading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <p>AI正在分析数据，请稍候...</p>
          </div>
        )}
      </Modal>

      <Drawer
        title="记录详情"
        placement="right"
        size={700}
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
                    <code style={{ padding: '2px 6px', backgroundColor: '#f5f5f5', borderRadius: 3, fontSize: 13 }}>
                      {currentRecord.record_id}
                    </code>
                  </div>
                </Col>
              </Row>
            </Card>

            {currentRecord.status === 'tagged' && currentRecord.tag && (
              <Card size="small" title="标签信息" style={{ marginBottom: 16 }}>
                <Space>
                  <Tag color={currentRecord.tag.color} style={{ fontSize: 14 }}>
                    <TagsOutlined /> {currentRecord.tag.name}
                  </Tag>
                </Space>
                {currentRecord.tagger && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">打标人：</Text>
                    <Text>{currentRecord.tagger.username}</Text>
                  </div>
                )}
                {currentRecord.tagged_at && (
                  <div>
                    <Text type="secondary">打标时间：</Text>
                    <Text>{new Date(currentRecord.tagged_at).toLocaleString()}</Text>
                  </div>
                )}
              </Card>
            )}

            {currentRecord.status === 'skipped' && (
              <Card size="small" title="跳过信息" style={{ marginBottom: 16, background: '#fffbe6' }}>
                <Tag color="warning" style={{ fontSize: 14 }}>
                  <EyeOutlined /> 不适用任何标签
                </Tag>
                {currentRecord.tagger && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">操作人：</Text>
                    <Text>{currentRecord.tagger.username}</Text>
                  </div>
                )}
                {currentRecord.tagged_at && (
                  <div>
                    <Text type="secondary">操作时间：</Text>
                    <Text>{new Date(currentRecord.tagged_at).toLocaleString()}</Text>
                  </div>
                )}
              </Card>
            )}

            <Card size="small" title="完整数据">
              <Descriptions column={1} size="small">
                {Object.entries(flattenData(currentRecord.data)).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    {value === null ? (
                      <Text type="secondary">NULL</Text>
                    ) : (
                      <code style={{ padding: '2px 6px', backgroundColor: '#f5f5f5', borderRadius: 3, fontSize: 13 }}>
                        {String(value)}
                      </code>
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
