'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Space, Tag, Modal, Form, Input, Select, InputNumber, Popconfirm, Typography, Row, Col, App, ColorPicker, message, Dropdown, Tree } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, TagOutlined, EyeOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Text } = Typography;
const { Option } = Select;

interface Tag {
  id: number;
  key: number;
  title: string;
  name: string;
  code: string;
  type: string;
  color: string;
  description?: string;
  status: number;
  sort_order: number;
  parent_id: number | null;
  children?: Tag[];
}

interface TagFormValues {
  name: string;
  code: string;
  parent_id?: number | null;
  type: string;
  color: string;
  description?: string;
  sort_order?: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentTag, setCurrentTag] = useState<Tag | null>(null);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchType, setSearchType] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [dropdownInfo, setDropdownInfo] = useState<{ visible: boolean; x: number; y: number; tag: Tag | null }>({
    visible: false,
    x: 0,
    y: 0,
    tag: null,
  });
  const rightClickTagRef = useRef<Tag | null>(null);
  const { message: msg } = App.useApp();
  const [form] = Form.useForm();
  const formRef = useRef<any>(null);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      console.log('开始获取标签数据...');
      const params = new URLSearchParams({ tree: 'true' });
      if (searchName) params.append('name', searchName);
      if (searchType) params.append('type', searchType);

      const response = await fetch(`/api/tags?${params.toString()}`);
      console.log('API响应状态:', response.status);
      
      const data = await response.json();
      console.log('API响应数据:', data);

      if (data.success) {
        console.log('标签数据长度:', data.data?.length || 0);
        console.log('标签数据:', JSON.stringify(data.data, null, 2));
        console.log('当前tags状态:', tags.length);
        setTags(data.data || []);
      } else {
        console.error('API错误:', data.message);
        msg.error(data.message || '获取标签列表失败');
      }
    } catch (error) {
      console.error('获取标签列表失败:', error);
      msg.error('获取标签列表失败');
    } finally {
      setLoading(false);
    }
  }, [searchName, searchType, msg]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    console.log('tags状态变化:', tags.length, '条数据');
    if (tags.length > 0) {
      console.log('标签数据:', JSON.stringify(tags, null, 2));
    }
  }, [tags]);

  const onExpand = (newExpandedKeys: React.Key[]) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  };

  const handleCreate = () => {
    setCurrentTag(null);
    setModalVisible(true);
    setTimeout(() => {
      form.resetFields();
    }, 100);
  };

  const handleEdit = (tag: Tag) => {
    setCurrentTag(tag);
    setModalVisible(true);
    setTimeout(() => {
      form.setFieldsValue({
        name: tag.name,
        code: tag.code,
        parent_id: tag.parent_id,
        type: tag.type,
        color: tag.color,
        description: tag.description,
        sort_order: tag.sort_order,
      });
    }, 100);
  };

  const handleView = (tag: Tag) => {
    console.log('handleView被调用，tag数据:', JSON.stringify(tag, null, 2));
    console.log('detailVisible当前值:', false);
    setCurrentTag(tag);
    console.log('设置currentTag后，currentTag:', JSON.stringify(tag, null, 2));
    console.log('设置detailVisible为: true');
    setDetailVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/tags/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        msg.success('标签删除成功');
        fetchTags();
      } else {
        msg.error(data.message || '删除失败');
      }
    } catch {
      msg.error('删除失败');
    }
  };

  const handleFormSubmit = async (values: TagFormValues) => {
    setFormLoading(true);
    try {
      console.log('表单提交数据:', JSON.stringify(values, null, 2));
      
      let colorValue: string = values.color || '#1890ff';
      
      if (values.color && typeof values.color === 'object') {
        colorValue = (values.color as any).toHexString?.() || '#1890ff';
      }
      
      const submitData = {
        name: values.name,
        code: values.code,
        parent_id: values.parent_id,
        type: values.type,
        color: colorValue,
        description: values.description,
        sort_order: values.sort_order,
      };
      
      console.log('提交数据:', JSON.stringify(submitData, null, 2));
      
      const url = currentTag ? `/api/tags/${currentTag.id}` : '/api/tags';
      const method = currentTag ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      const data = await response.json();

      if (data.success) {
        msg.success(currentTag ? '标签更新成功' : '标签创建成功');
        fetchTags();
        setModalVisible(false);
        setIsAddingChild(false);
      } else {
        msg.error(data.message || '操作失败');
      }
    } catch {
      msg.error('操作失败');
    } finally {
      setFormLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      '分类': 'blue',
      '业务': 'green',
      '自定义': 'orange',
    };
    return colors[type] || 'default';
  };

  const getTagColor = (color: string) => color || '#1890ff';

  const onRightClick = ({ event, node }: { event: React.MouseEvent; node: any }) => {
    event.preventDefault();
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    console.log('右键点击节点:', node.name);
    setDropdownInfo({
      visible: true,
      x: rect.left,
      y: rect.bottom,
      tag: node,
    });
  };

  const handleDropdownAction = (action: string, tag: Tag | null) => {
    if (!tag) {
      console.error('tag为空，无法执行操作');
      return;
    }
    console.log('handleDropdownAction被调用:', action, 'tag:', tag.name);
    setDropdownInfo({ visible: false, x: 0, y: 0, tag: null });
    
    switch (action) {
      case 'view':
        console.log('执行view操作');
        handleView(tag);
        break;
      case 'edit':
        console.log('执行edit操作');
        handleEdit(tag);
        break;
      case 'add_child':
        console.log('执行add_child操作');
        setIsAddingChild(true);
        setModalVisible(true);
        setTimeout(() => {
          form.resetFields();
          form.setFieldsValue({ parent_id: tag.id });
        }, 100);
        break;
      case 'delete':
        console.log('执行delete操作');
        Modal.confirm({
          title: '确认删除',
          content: `确定要删除标签 "${tag.name}" 吗？删除后无法恢复。`,
          okText: '确认删除',
          cancelText: '取消',
          okButtonProps: { danger: true },
          onOk: () => handleDelete(tag.id),
        });
        break;
    }
  };

  const getDropdownMenuItems = (tag: Tag | null) => {
    if (!tag) return [];
    
    return [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: '查看详情',
        onClick: () => handleDropdownAction('view', tag),
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑标签',
        onClick: () => handleDropdownAction('edit', tag),
      },
      {
        key: 'add_child',
        icon: <PlusOutlined />,
        label: '添加子标签',
        onClick: () => handleDropdownAction('add_child', tag),
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除标签',
        danger: true,
        onClick: () => handleDropdownAction('delete', tag),
      },
    ];
  };

  const dropdownMenuItems = getDropdownMenuItems(dropdownInfo.tag);

  const renderTreeNodes = (nodes: Tag[]): any[] => {
    console.log('renderTreeNodes被调用，nodes数量:', nodes.length);
    return nodes.map((node) => {
      console.log('渲染节点:', node.name, 'children:', node.children?.length || 0);
      return {
        key: node.id,
        title: (
          <div 
            onContextMenu={(e) => {
              e.preventDefault();
              console.log('右键点击节点:', node.name);
              const rect = e.currentTarget.getBoundingClientRect();
              setDropdownInfo({
                visible: true,
                x: rect.left,
                y: rect.bottom,
                tag: node,
              });
            }}
            style={{ padding: '4px 0' }}
          >
            <Space>
              <Tag color={getTagColor(node.color)}>{node.name}</Tag>
              <Tag color={getTypeColor(node.type)}>{node.type}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>{node.code}</Text>
            </Space>
          </div>
        ),
        children: node.children && node.children.length > 0 ? renderTreeNodes(node.children) : undefined,
      };
    });
  };

  const pageContent = (
    <>
      <Card 
        title={<><TagOutlined /> 标签管理</>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            添加标签
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="搜索标签名称"
                prefix={<SearchOutlined />}
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onPressEnter={fetchTags}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="标签类型"
                style={{ width: '100%' }}
                value={searchType || undefined}
                onChange={setSearchType}
                allowClear
              >
                <Option value="分类">分类</Option>
                <Option value="业务">业务</Option>
                <Option value="自定义">自定义</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={10}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={fetchTags}>
                  搜索
                </Button>
                <Button icon={<ReloadOutlined />} onClick={fetchTags}>
                  刷新
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 16, minHeight: 400, background: '#fff' }}>
          <div id="tree-debug" style={{ padding: 8, marginBottom: 8, background: '#f0f0f0', borderRadius: 4 }}>
            标签数量: {tags.length} - {tags.length === 0 ? '无数据' : '有数据'}
          </div>
          {tags.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
              暂无标签数据，点击上方按钮添加
            </div>
          ) : (
            <div onContextMenu={(e) => e.preventDefault()}>
              <Tree
                onExpand={onExpand}
                expandedKeys={expandedKeys}
                autoExpandParent={autoExpandParent}
                treeData={renderTreeNodes(tags)}
                showIcon={true}
                blockNode
              />
              <Dropdown
                menu={{ items: dropdownMenuItems }}
                trigger={['click']}
                open={dropdownInfo.visible}
                onOpenChange={(open) => setDropdownInfo(prev => ({ ...prev, visible: open }))}
                placement="bottomLeft"
              >
                <div
                  style={{
                    position: 'fixed',
                    left: dropdownInfo.x,
                    top: dropdownInfo.y,
                    width: 1,
                    height: 1,
                    opacity: 0,
                    pointerEvents: 'auto',
                  }}
                />
              </Dropdown>
            </div>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <Text type="secondary">
            提示：右键点击标签可进行编辑、添加子标签或删除操作
          </Text>
        </div>
      </Card>

      <Modal
        title={currentTag ? '编辑标签' : (isAddingChild ? '添加子标签' : '添加标签')}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setIsAddingChild(false);
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{ type: '自定义', color: '#1890ff', sort_order: 0 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="标签名称"
                rules={[{ required: true, message: '请输入标签名称' }]}
              >
                <Input placeholder="请输入标签名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="code"
                label="标签编码"
                rules={[{ required: true, message: '请输入标签编码' }]}
              >
                <Input placeholder="请输入标签编码（唯一）" disabled={!!currentTag?.id} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="parent_id"
                label="父标签"
                getValueFromEvent={(value) => value === undefined ? null : value}
              >
                <Select
                  placeholder="请选择父标签（可选）"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {tags.map((tag) => (
                    <Option key={tag.id} value={tag.id}>
                      {tag.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="type"
                label="标签类型"
                rules={[{ required: true, message: '请选择标签类型' }]}
              >
                <Select placeholder="请选择标签类型">
                  <Option value="分类">分类</Option>
                  <Option value="业务">业务</Option>
                  <Option value="自定义">自定义</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="color"
                label="标签颜色"
                rules={[{ required: true, message: '请选择标签颜色' }]}
                getValueFromEvent={(color) => {
                  if (color && typeof color === 'object') {
                    return color.toHexString?.() || '#1890ff';
                  }
                  return color;
                }}
              >
                <ColorPicker format="hex" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="sort_order"
                label="排序顺序"
              >
                <InputNumber min={0} placeholder="请输入排序数字" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                name="description"
                label="标签描述"
              >
                <Input.TextArea rows={3} placeholder="标签描述（选填）" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={formLoading}>
                {currentTag ? '保存修改' : '创建标签'}
              </Button>
              <Button onClick={() => form.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="标签详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="edit" type="primary" onClick={() => {
            setDetailVisible(false);
            handleEdit(currentTag!);
          }}>
            编辑
          </Button>,
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={500}
      >
        {currentTag && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">名称：</Text>
                <Text strong>{currentTag.name}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">编码：</Text>
                <Text code>{currentTag.code}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">类型：</Text>
                <Tag color={getTypeColor(currentTag.type)}>
                  {currentTag.type}
                </Tag>
              </Col>
              <Col span={12}>
                <Text type="secondary">颜色：</Text>
                <Tag color={getTagColor(currentTag.color)}>
                  {currentTag.color}
                </Tag>
              </Col>
              <Col span={12}>
                <Text type="secondary">状态：</Text>
                <Tag color={currentTag.status === 1 ? 'green' : 'red'}>
                  {currentTag.status === 1 ? '启用' : '禁用'}
                </Tag>
              </Col>
              <Col span={12}>
                <Text type="secondary">排序：</Text>
                <Text>{currentTag.sort_order}</Text>
              </Col>
              <Col span={24}>
                <Text type="secondary">描述：</Text>
                <Text>{currentTag.description || '无'}</Text>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </>
  );

  return <MainLayout title="标签管理">{pageContent}</MainLayout>;
}
