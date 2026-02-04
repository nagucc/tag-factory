'use client';

import { Card, Row, Col, Statistic, App } from 'antd';
import { TeamOutlined, DatabaseOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';

export default function HomePage() {
  const router = useRouter();
  const { message } = App.useApp();

  const pageContent = (
    <>
      <Card title={<><TeamOutlined /> 快捷功能</>}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card hoverable onClick={() => router.push('/data-sources')}>
              <Statistic
                value="数据源管理"
                prefix={<DatabaseOutlined style={{ color: '#1890ff' }} />}
                title="管理数据库连接配置"
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card hoverable onClick={() => message.info('数据对象管理功能开发中')}>
              <Statistic
                value="数据对象管理"
                prefix={<AppstoreOutlined style={{ color: '#52c41a' }} />}
                title="管理数据对象定义"
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card hoverable onClick={() => message.info('标签管理功能开发中')}>
              <Statistic
                value="标签管理"
                prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
                title="管理数据标签"
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </>
  );

  return <MainLayout title="首页">{pageContent}</MainLayout>;
}
