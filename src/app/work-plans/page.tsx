'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input,
  Select, Popconfirm, Typography, Row, Col, App, message,
  Progress, Drawer, Descriptions, Avatar, List, Badge, Divider
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, ReloadOutlined, EyeOutlined,
  TeamOutlined, CheckCircleOutlined, SyncOutlined,
  ClockCircleOutlined, PlayCircleOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface DataObject {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface WorkPlanTag {
  id: number;
  tag_id: number;
  tag?: {
    id: number;
    name: string;
    color: string;
  };
}

interface WorkPlan {
  id: number;
  name: string;
  description?: string;
  data_object_id: number;
  data_object_name?: string;
  status: string;
  total_records: number;
  tagged_records: number;
  progress: number;
  memberCount: number;
  workPlanTags?: WorkPlanTag[];
  started_at?: string;
  completed_at?: string;
  creator_name?: string;
  created_at: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function WorkPlansPage() {
  const router = useRouter();
  const [workPlans, setWorkPlans] = useState<WorkPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [dataObjects, setDataObjects] = useState<DataObject[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [currentWorkPlan, setCurrentWorkPlan] = useState<WorkPlan | null>(null);
  const [searchDataObject, setSearchDataObject] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const { message: msg } = App.useApp();
  const [form] = Form.useForm();

  const fetchWorkPlans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });
      if (searchDataObject) params.append('dataObjectId', searchDataObject);
      if (searchStatus) params.append('status', searchStatus);
      if (userInfo?.id) params.append('userId', userInfo.id.toString());

      const response = await fetch(`/api/work-plans?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setWorkPlans(data.data.list);
        setPagination(prev => ({ ...prev, ...data.data.pagination }));
      } else {
        msg.error(data.message || '获取工作计划列表失败');
      }
    } catch {
      msg.error('获取工作计划列表失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, searchDataObject, searchStatus, userInfo?.id, msg]);

  const fetchDataObjects = useCallback(async () => {
    try {
      const response = await fetch('/api/data-objects?pageSize=100');
      const data = await response.json();
      if (data.success) {
        setDataObjects(data.data.list);
      }
    } catch {
      console.error('获取数据对象列表失败');
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags?pageSize=1000');
      const data = await response.json();
      if (data.success) {
        const tags = data.data.list || [];
        setAllTags(tags);
        setAvailableTags(tags);
      }
    } catch {
      console.error('获取标签列表失败');
    }
  }, []);

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

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  useEffect(() => {
    fetchDataObjects();
    fetchTags();
  }, [fetchDataObjects, fetchTags]);

  useEffect(() => {
    if (userInfo) {
      fetchWorkPlans();
    }
  }, [userInfo, fetchWorkPlans]);

  const handleTableChange = (newPagination: any) => {
    setPagination(prev => ({ ...prev, page: newPagination.current, pageSize: newPagination.pageSize }));
  };

  const handleCreate = () => {
    setCurrentWorkPlan(null);
    setSelectedTagIds([]);
    setModalVisible(true);
    setTimeout(() => {
      form.resetFields();
    }, 100);
  };

  const handleView = (workPlan: WorkPlan) => {
    setCurrentWorkPlan(workPlan);
    setDetailDrawerVisible(true);
  };

  const handleExecute = (workPlan: WorkPlan) => {
    router.push(`/work-plans/${workPlan.id}/tasks`);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/work-plans/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        msg.success('工作计划删除成功');
        fetchWorkPlans();
      } else {
        msg.error(data.message || '删除失败');
      }
    } catch {
      msg.error('删除失败');
    }
  };

  const handleFormSubmit = async (values: any) => {
    if (!values.data_object_id) {
      msg.error('请选择数据对象');
      return;
    }

    setFormLoading(true);
    try {
      const submitData = {
        name: values.name,
        description: values.description,
        data_object_id: values.data_object_id,
        tag_ids: selectedTagIds,
        user_id: userInfo?.id,
      };

      const response = await fetch('/api/work-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      const data = await response.json();

      if (data.success) {
        msg.success('工作计划创建成功');
        fetchWorkPlans();
        setModalVisible(false);
      } else {
        msg.error(data.message || '创建失败');
      }
    } catch {
      msg.error('创建失败');
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormUpdate = async (values: any) => {
    if (!currentWorkPlan) return;
    if (!values.data_object_id) {
      msg.error('请选择数据对象');
      return;
    }

    setFormLoading(true);
    try {
      const submitData = {
        name: values.name,
        description: values.description,
        data_object_id: values.data_object_id,
        status: values.status,
        tag_ids: selectedTagIds,
      };

      const response = await fetch(`/api/work-plans/${currentWorkPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      const data = await response.json();

      if (data.success) {
        msg.success('工作计划更新成功');
        fetchWorkPlans();
        setEditModalVisible(false);
      } else {
        msg.error(data.message || '更新失败');
      }
    } catch {
      msg.error('更新失败');
    } finally {
      setFormLoading(false);
    }
  };

  const handleTagSelectionChange = (ids: number[]) => {
    setSelectedTagIds(ids);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'processing';
      case 'completed': return 'success';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '进行中';
      case 'completed': return '已完成';
      case 'archived': return '已归档';
      default: return status;
    }
  };

  const columns = [
    {
      title: '工作计划名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '数据对象',
      dataIndex: 'data_object_name',
      key: 'dataObject',
      render: (text: string) => <Tag color="blue">{text || '-'}</Tag>,
    },
    {
      title: '进度',
      key: 'progress',
      render: (_: any, record: WorkPlan) => (
        <Progress
          percent={record.progress}
          size="small"
          status={record.progress === 100 ? 'success' : 'active'}
        />
      ),
    },
    {
      title: '记录数',
      key: 'records',
      render: (_: any, record: WorkPlan) => (
        <Space>
          <Text>{record.tagged_records}/{record.total_records}</Text>
        </Space>
      ),
    },
    {
      title: '成员数',
      dataIndex: 'memberCount',
      key: 'members',
      render: (count: number) => (
        <Space>
          <TeamOutlined />
          <Text>{count}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      key: 'creator',
      render: (text: string) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: WorkPlan) => (
        <Space size="small">
          <Tooltip title="执行任务">
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleExecute(record)}
              disabled={record.status !== 'active'}
            />
          </Tooltip>
          <Tooltip title="查看详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除"
            description="确定要删除此工作计划吗？相关数据将一起删除。"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleEdit = (workPlan: WorkPlan) => {
    setCurrentWorkPlan(workPlan);
    const currentTagIds = workPlan.workPlanTags?.map((wt: any) => wt.tag_id) || [];
    setSelectedTagIds(currentTagIds);
    setEditModalVisible(true);
    setTimeout(() => {
      form.setFieldsValue({
        name: workPlan.name,
        description: workPlan.description,
        data_object_id: workPlan.data_object_id,
        status: workPlan.status,
      });
    }, 100);
  };

  const Tooltip = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <span title={title} style={{ cursor: 'pointer' }}>{children}</span>
  );

  const pageContent = (
    <>
      <Card
        title={<><ClockCircleOutlined /> 工作计划管理</>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建计划
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="选择数据对象"
                style={{ width: '100%' }}
                value={searchDataObject || undefined}
                onChange={setSearchDataObject}
                allowClear
              >
                {dataObjects.map(ds => (
                  <Option key={ds.id} value={ds.id}>{ds.name}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="状态"
                style={{ width: '100%' }}
                value={searchStatus || undefined}
                onChange={setSearchStatus}
                allowClear
              >
                <Option value="active">进行中</Option>
                <Option value="completed">已完成</Option>
                <Option value="archived">已归档</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={10}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={fetchWorkPlans}>
                  搜索
                </Button>
                <Button icon={<ReloadOutlined />} onClick={fetchWorkPlans}>
                  刷新
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={workPlans}
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
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="创建工作计划"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          <Form.Item
            name="name"
            label="计划名称"
            rules={[{ required: true, message: '请输入计划名称' }]}
          >
            <Input placeholder="请输入工作计划名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="计划描述"
          >
            <TextArea rows={3} placeholder="工作计划描述（选填）" />
          </Form.Item>

          <Form.Item
            name="data_object_id"
            label="数据对象"
            rules={[{ required: true, message: '请选择数据对象' }]}
          >
            <Select
              placeholder="选择数据对象"
              showSearch
              optionFilterProp="children"
            >
              {dataObjects.map(ds => (
                <Option key={ds.id} value={ds.id}>{ds.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="可用标签"
            tooltip="选择参与人员可以使用的标签"
          >
            <Select
              mode="multiple"
              placeholder="选择可用标签"
              value={selectedTagIds}
              onChange={handleTagSelectionChange}
              style={{ width: '100%' }}
              maxTagCount={5}
              showSearch
              optionFilterProp="children"
            >
              {allTags.map(tag => (
                <Option key={tag.id} value={tag.id}>
                  <Tag color={tag.color}>{tag.name}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={formLoading}>
                创建计划
              </Button>
              <Button onClick={() => form.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑工作计划"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormUpdate}
        >
          <Form.Item
            name="name"
            label="计划名称"
            rules={[{ required: true, message: '请输入计划名称' }]}
          >
            <Input placeholder="请输入工作计划名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="计划描述"
          >
            <TextArea rows={3} placeholder="工作计划描述（选填）" />
          </Form.Item>

          <Form.Item
            name="data_object_id"
            label="数据对象"
            rules={[{ required: true, message: '请选择数据对象' }]}
          >
            <Select
              placeholder="选择数据对象"
              showSearch
              optionFilterProp="children"
            >
              {dataObjects.map(ds => (
                <Option key={ds.id} value={ds.id}>{ds.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="计划状态"
          >
            <Select placeholder="选择状态">
              <Option value="active">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="archived">已归档</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="可用标签"
            tooltip="选择参与人员可以使用的标签"
          >
            <Select
              mode="multiple"
              placeholder="选择可用标签"
              value={selectedTagIds}
              onChange={handleTagSelectionChange}
              style={{ width: '100%' }}
              maxTagCount={5}
              showSearch
              optionFilterProp="children"
            >
              {allTags.map(tag => (
                <Option key={tag.id} value={tag.id}>
                  <Tag color={tag.color}>{tag.name}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={formLoading}>
                保存修改
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="工作计划详情"
        placement="right"
        size={600}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        extra={
          currentWorkPlan?.status === 'active' && (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => {
                setDetailDrawerVisible(false);
                handleExecute(currentWorkPlan);
              }}
            >
              开始执行
            </Button>
          )
        }
      >
        {currentWorkPlan && (
          <>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="计划名称">
                  <Text strong style={{ fontSize: 16 }}>{currentWorkPlan.name}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="描述">
                  {currentWorkPlan.description || '无'}
                </Descriptions.Item>
                <Descriptions.Item label="数据对象">
                  <Tag color="blue">{currentWorkPlan.data_object_name}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={getStatusColor(currentWorkPlan.status)}>
                    {getStatusText(currentWorkPlan.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="创建人">{currentWorkPlan.creator_name}</Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {new Date(currentWorkPlan.created_at).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="进度统计" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="总记录数" value={currentWorkPlan.total_records} />
                </Col>
                <Col span={8}>
                  <Statistic title="已打标" value={currentWorkPlan.tagged_records} />
                </Col>
                <Col span={8}>
                  <Statistic title="完成率" value={`${currentWorkPlan.progress}%`} />
                </Col>
              </Row>
              <Progress
                percent={currentWorkPlan.progress}
                status={currentWorkPlan.progress === 100 ? 'success' : 'active'}
                style={{ marginTop: 16 }}
              />
            </Card>

            <Card size="small" title="成员数量">
              <Statistic title="参与成员" value={currentWorkPlan.memberCount} icon={<TeamOutlined />} />
            </Card>
          </>
        )}
      </Drawer>
    </>
  );

  return <MainLayout title="工作计划管理">{pageContent}</MainLayout>;
}

function Statistic({ title, value, icon }: { title: string; value: number | string; icon?: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: '#999', fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 4 }}>
        {icon} {value}
      </div>
    </div>
  );
}
