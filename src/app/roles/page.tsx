'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, Transfer, App, Popconfirm, Typography, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { useRouter } from 'next/navigation';

const { Text } = Typography;
const { Option } = Select;

interface Permission {
  id: number;
  key: string;
  title: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

interface Role {
  id: number;
  name: string;
  description?: string;
  status: number;
  permissionCount: number;
  userCount: number;
  created_at: string;
}

interface RoleDetail {
  id: number;
  name: string;
  description?: string;
  status: number;
  permissions: Permission[];
  users: any[];
}

const resourceLabels: Record<string, string> = {
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
  'audit-logs': '审计日志',
  'system': '系统',
};

const actionLabels: Record<string, string> = {
  'read': '查看',
  'create': '创建',
  'update': '更新',
  'delete': '删除',
  'manage': '管理',
};

export default function RolesPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [currentRole, setCurrentRole] = useState<RoleDetail | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.current.toString());
      params.append('pageSize', pagination.pageSize.toString());

      const response = await fetch(`/api/roles?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setRoles(data.data.list);
        setPagination(prev => ({ ...prev, total: data.data.pagination.total }));
      } else {
        message.error(data.message || '获取角色列表失败');
      }
    } catch {
      message.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleTableChange = (pag: any) => {
    setPagination(prev => ({ ...prev, current: pag.current, pageSize: pag.pageSize }));
  };

  const handleAdd = () => {
    setCurrentRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = async (record: Role) => {
    try {
      const response = await fetch(`/api/roles/${record.id}`);
      const data = await response.json();
      if (data.success) {
        const role = data.data;
        setCurrentRole(role);
        form.setFieldsValue({
          name: role.name,
          description: role.description,
          status: role.status,
        });
        setModalVisible(true);
      } else {
        message.error(data.message || '获取角色详情失败');
      }
    } catch {
      message.error('获取角色详情失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        message.success('角色删除成功');
        fetchRoles();
      } else {
        message.error(data.message || '删除失败');
      }
    } catch {
      message.error('删除失败');
    }
  };

  const handlePermissionManage = async (record: Role) => {
    try {
      const response = await fetch(`/api/roles/${record.id}/permissions`);
      const data = await response.json();
      if (data.success) {
        const roleData = data.data;
        setCurrentRole({
          id: roleData.role.id,
          name: roleData.role.name,
          description: roleData.role.description,
          status: roleData.role.status,
          permissions: roleData.assignedPermissions || [],
          users: [],
        });

        const permissions: Permission[] = [];
        Object.values(roleData.allPermissions || {}).forEach((list: any) => {
          list.forEach((p: any) => {
            permissions.push({
              id: p.id,
              key: p.id.toString(),
              title: `${resourceLabels[p.resource] || p.resource}-${actionLabels[p.action] || p.action}`,
              name: p.name,
              resource: p.resource,
              action: p.action,
              description: p.description,
            });
          });
        });

        setAllPermissions(permissions);
        setSelectedPermissions((roleData.assignedPermissions || []).map((p: any) => p.id.toString()));
        setPermissionModalVisible(true);
      } else {
        message.error(data.message || '获取权限列表失败');
      }
    } catch {
      message.error('获取权限列表失败');
    }
  };

  const handleFormSubmit = async (values: any) => {
    setFormLoading(true);
    try {
      const url = currentRole ? `/api/roles/${currentRole.id}` : '/api/roles';
      const method = currentRole ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (data.success) {
        message.success(currentRole ? '角色更新成功' : '角色创建成功');
        setModalVisible(false);
        fetchRoles();
      } else {
        message.error(data.message || '操作失败');
      }
    } catch {
      message.error('操作失败');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePermissionSave = async () => {
    if (!currentRole) return;
    setFormLoading(true);
    try {
      const response = await fetch(`/api/roles/${currentRole.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission_ids: selectedPermissions.map(id => parseInt(id)) }),
      });
      const data = await response.json();
      if (data.success) {
        message.success('权限更新成功');
        setPermissionModalVisible(false);
        fetchRoles();
      } else {
        message.error(data.message || '保存失败');
      }
    } catch {
      message.error('保存失败');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
    {
      title: '权限数量',
      dataIndex: 'permissionCount',
      key: 'permissionCount',
      width: 100,
      render: (count: number) => <Tag color="blue">{count}</Tag>,
    },
    {
      title: '用户数量',
      dataIndex: 'userCount',
      key: 'userCount',
      width: 100,
      render: (count: number) => <Tag color="green">{count}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: number) => (
        <Tag color={status === 1 ? 'success' : 'error'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Role) => (
        <Space>
          <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => handlePermissionManage(record)}>
            权限
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此角色？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
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
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建角色
        </Button>
        <Button icon={<ReloadOutlined />} onClick={fetchRoles} style={{ marginLeft: 8 }}>
          刷新
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={roles}
        loading={loading}
        rowKey="id"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={currentRole ? '编辑角色' : '新建角色'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" disabled={currentRole?.name === 'admin' || currentRole?.name === 'user'} />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入角色描述" />
          </Form.Item>

          <Form.Item name="status" label="状态" initialValue={1}>
            <Select>
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={formLoading}>
                {currentRole ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`权限配置 - ${currentRole?.name}`}
        open={permissionModalVisible}
        onCancel={() => setPermissionModalVisible(false)}
        onOk={handlePermissionSave}
        confirmLoading={formLoading}
        width={700}
        okText="保存"
      >
        <Transfer
          dataSource={allPermissions}
          titles={['可选权限', '已选权限']}
          targetKeys={selectedPermissions}
          onChange={setSelectedPermissions}
          render={item => item.title}
          listStyle={{ width: 280, height: 400 }}
          showSearch
          filterOption={(inputValue, item) => item.title.toLowerCase().includes(inputValue.toLowerCase())}
        />
      </Modal>

      <Form form={form} style={{ display: 'none' }} />
    </>
  );

  return <MainLayout title="角色管理">{pageContent}</MainLayout>;
}
