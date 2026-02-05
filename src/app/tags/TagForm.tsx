'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Form, Input, Select, InputNumber, Button, Card, Row, Col, Space, App, ColorPicker } from 'antd';
import { TagOutlined } from '@ant-design/icons';

interface TagFormProps {
  initialValues?: any;
  onSubmit: (values: any) => Promise<void>;
  onReset?: () => void;
  loading?: boolean;
  parentTags?: any[];
}

const { Option } = Select;
const { TextArea } = Input;

const TagForm = forwardRef<any, TagFormProps>(({ initialValues, onSubmit, onReset, loading, parentTags = [] }, ref) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        name: initialValues.name,
        code: initialValues.code,
        parent_id: initialValues.parent_id,
        type: initialValues.type,
        color: initialValues.color,
        description: initialValues.description,
        sort_order: initialValues.sort_order,
      });
    }
  }, [initialValues, form]);

  useImperativeHandle(ref, () => ({
    resetForm: () => {
      form.resetFields();
    },
    getFieldsValue: () => form.getFieldsValue(),
  }));

  const handleSubmit = async (values: any) => {
    await onSubmit(values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ type: '自定义', color: '#1890ff', sort_order: 0 }}
    >
      <Card title={<><TagOutlined /> 基本信息</>} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={12}>
            <Form.Item
              name="name"
              label="标签名称"
              rules={[{ required: true, message: '请输入标签名称' }]}
            >
              <Input placeholder="请输入标签名称" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={12}>
            <Form.Item
              name="code"
              label="标签编码"
              rules={[{ required: true, message: '请输入标签编码' }]}
            >
              <Input placeholder="请输入标签编码（唯一）" disabled={!!initialValues?.id} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={12}>
            <Form.Item
              name="parent_id"
              label="父标签"
            >
              <Select
                placeholder="请选择父标签（可选）"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {parentTags.map((tag: any) => (
                  <Option key={tag.id} value={tag.id}>
                    {tag.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={12}>
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
          <Col xs={24} sm={12} md={12}>
            <Form.Item
              name="color"
              label="标签颜色"
              rules={[{ required: true, message: '请选择标签颜色' }]}
            >
              <ColorPicker format="hex" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={12}>
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
              <TextArea rows={3} placeholder="标签描述（选填）" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialValues?.id ? '保存修改' : '创建标签'}
          </Button>
          <Button onClick={() => form.resetFields()}>重置</Button>
        </Space>
      </Card>
    </Form>
  );
});

TagForm.displayName = 'TagForm';

export default TagForm;
