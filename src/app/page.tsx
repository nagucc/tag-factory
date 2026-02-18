'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Row, Col, Typography, Space, Statistic, Tag, Divider } from 'antd';
import { DatabaseOutlined, TagOutlined, ApiOutlined, BarChartOutlined, SafetyOutlined, ThunderboltOutlined, RocketOutlined, TeamOutlined, ArrowRightOutlined, LoginOutlined } from '@ant-design/icons';
import './landing.css';

const { Title, Paragraph, Text } = Typography;

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface Scenario {
  title: string;
  description: string;
  tags: string[];
}

export default function LandingPage() {
  const router = useRouter();
  const [userStatus, setUserStatus] = useState<'loading' | 'logged_in' | 'logged_out'>('loading');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await response.json();
      setUserStatus(data.success ? 'logged_in' : 'logged_out');
    } catch {
      setUserStatus('logged_out');
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const features: Feature[] = [
    {
      icon: <DatabaseOutlined style={{ fontSize: 40, color: '#1890ff' }} />,
      title: '多数据源支持',
      description: '支持连接MySQL、PostgreSQL、MongoDB等多种数据库，统一管理不同来源的数据对象',
    },
    {
      icon: <TagOutlined style={{ fontSize: 40, color: '#52c41a' }} />,
      title: '标签体系管理',
      description: '灵活构建企业级标签体系，支持标签分组、层级结构、标签规则自动打标',
    },
    {
      icon: <ApiOutlined style={{ fontSize: 40, color: '#722ed1' }} />,
      title: '开放式API',
      description: '提供完整的RESTful API，支持与企业现有系统无缝集成',
    },
    {
      icon: <BarChartOutlined style={{ fontSize: 40, color: '#faad14' }} />,
      title: '智能数据分析',
      description: '多维度标签统计分析，可视化展示标签分布与应用效果',
    },
    {
      icon: <SafetyOutlined style={{ fontSize: 40, color: '#f5222d' }} />,
      title: '权限与审计',
      description: '完善的角色权限体系，全链路操作审计，确保数据安全合规',
    },
    {
      icon: <ThunderboltOutlined style={{ fontSize: 40, color: '#13c2c2' }} />,
      title: '自动化工作流',
      description: '支持创建工作计划，批量执行标签任务，提升运营效率',
    },
  ];

  const scenarios: Scenario[] = [
    {
      title: '用户画像与精准营销',
      description: '为电商平台构建用户标签体系，实现用户分群、精准营销和个性化推荐',
      tags: ['用户画像', '行为分析', '精准营销'],
    },
    {
      title: '数据治理与资产盘点',
      description: '对企业数据进行分类分级标注，建立数据资产目录，支撑数据治理工作',
      tags: ['数据治理', '资产盘点', '分类分级'],
    },
    {
      title: '风控与合规检查',
      description: '构建风控标签体系，支持实时风险识别与合规性自动化检测',
      tags: ['风控标签', '合规检查', '实时监测'],
    },
    {
      title: '业务指标监控',
      description: '为业务系统提供标签化指标管理，实现业务状态的实时监控与预警',
      tags: ['指标监控', '业务洞察', '智能预警'],
    },
  ];

  const advantages = [
    '可视化标签建模，降低使用门槛',
    '灵活的标签规则配置，支撑复杂业务场景',
    '高性能批量处理，百万级数据秒级打标',
    '完整的API生态，无缝集成企业系统',
    '企业级安全架构，数据安全有保障',
  ];

  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="header-content">
          <div className="logo">
            <TagOutlined style={{ fontSize: 28, color: '#1890ff', marginRight: 8 }} />
            <span className="logo-text">Tag Factory</span>
          </div>
          <nav className="header-nav">
            <a href="#features">核心功能</a>
            <a href="#scenarios">应用场景</a>
            <a href="#advantages">产品优势</a>
          </nav>
          <div className="header-actions">
            {userStatus === 'logged_in' ? (
              <Button type="primary" size="large" icon={<RocketOutlined />} onClick={handleGoToDashboard}>
                进入控制台
              </Button>
            ) : (
              <>
                <Button size="large" onClick={handleLogin}>
                  登录
                </Button>
                <Button type="primary" size="large" icon={<RocketOutlined />} onClick={handleGoToDashboard}>
                  立即体验
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <Title level={1} className="hero-title">
            智能数据标签管理平台
          </Title>
          <Paragraph className="hero-description">
            面向企业的数据标签全生命周期管理平台，帮助您快速构建、管理和应用数据标签，
            释放数据价值，驱动业务增长。
          </Paragraph>
          <Space size="large" className="hero-actions">
            <Button type="primary" size="large" icon={<RocketOutlined />} onClick={handleGoToDashboard} className="hero-btn-primary">
              免费试用
            </Button>
            <Button size="large" icon={<ArrowRightOutlined />} onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              了解更多
            </Button>
          </Space>
          <div className="hero-stats">
            <Statistic title="支持数据源类型" value={8} suffix="+" />
            <Statistic title="日处理数据量" value={1000} suffix="万+" />
            <Statistic title="企业用户数" value={500} suffix="+" />
            <Statistic title="系统可用性" value={99.9} suffix="%" />
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="section-content">
          <Title level={2} className="section-title">核心功能</Title>
          <Paragraph className="section-description">
            完整的数据标签管理能力，满足企业多样化的业务需求
          </Paragraph>
          <Row gutter={[32, 32]} className="features-grid">
            {features.map((feature, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <Card hoverable className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <Title level={4} className="feature-title">{feature.title}</Title>
                  <Paragraph className="feature-description">{feature.description}</Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      <section id="scenarios" className="scenarios-section">
        <div className="section-content">
          <Title level={2} className="section-title">应用场景</Title>
          <Paragraph className="section-description">
            广泛适用于多个行业和业务领域，助力企业数字化转型
          </Paragraph>
          <Row gutter={[32, 32]} className="scenarios-grid">
            {scenarios.map((scenario, index) => (
              <Col xs={24} lg={12} key={index}>
                <Card className="scenario-card">
                  <Title level={4} className="scenario-title">{scenario.title}</Title>
                  <Paragraph className="scenario-description">{scenario.description}</Paragraph>
                  <Space wrap>
                    {scenario.tags.map((tag, tagIndex) => (
                      <Tag key={tagIndex} color="blue">{tag}</Tag>
                    ))}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      <section id="advantages" className="advantages-section">
        <div className="section-content">
          <Title level={2} className="section-title">产品优势</Title>
          <Row gutter={[48, 24]} justify="center" style={{ maxWidth: 900, margin: '0 auto' }}>
            <Col xs={24} md={12}>
              <ul className="advantage-list">
                {advantages.map((item, index) => (
                  <li key={index} className="advantage-item">
                    <SafetyOutlined style={{ color: '#52c41a', fontSize: 20, marginRight: 12 }} />
                    <Text>{item}</Text>
                  </li>
                ))}
              </ul>
            </Col>
            <Col xs={24} md={12}>
              <Card className="advantage-card">
                <div className="advantage-highlight">
                  <Title level={3} style={{ margin: 0, color: '#fff' }}>快速上手</Title>
                  <Paragraph style={{ color: 'rgba(255,255,255,0.85)', marginTop: 16 }}>
                    简洁直观的操作界面，分钟级完成系统配置，立即开始标签管理之旅
                  </Paragraph>
                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<LoginOutlined />} 
                    onClick={handleGoToDashboard}
                    className="advantage-btn"
                  >
                    立即体验
                  </Button>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      <section className="cta-section">
        <div className="section-content">
          <Title level={2} style={{ color: '#fff' }}>准备好开始了吗？</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18 }}>
            立即体验 Tag Factory，让数据标签管理变得简单高效
          </Paragraph>
          <Space size="large">
            <Button size="large" icon={<RocketOutlined />} onClick={handleGoToDashboard} className="cta-btn">
              免费试用
            </Button>
            <Button size="large" onClick={handleLogin} className="cta-btn-secondary">
              账号登录
            </Button>
          </Space>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <TagOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 8 }} />
            <span className="logo-text">Tag Factory</span>
            <Paragraph type="secondary" style={{ marginTop: 8 }}>
              智能数据标签管理平台
            </Paragraph>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <Text strong>产品</Text>
              <ul>
                <li><a href="#features">核心功能</a></li>
                <li><a href="#scenarios">应用场景</a></li>
                <li><a href="#advantages">产品优势</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <Text strong>资源</Text>
              <ul>
                <li><a href="#">使用文档</a></li>
                <li><a href="#">API 参考</a></li>
                <li><a href="#">常见问题</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <Text strong>公司</Text>
              <ul>
                <li><a href="#">关于我们</a></li>
                <li><a href="#">联系方式</a></li>
                <li><a href="#">隐私政策</a></li>
              </ul>
            </div>
          </div>
        </div>
        <Divider />
        <div className="footer-copyright">
          <Text type="secondary">© 2026 Tag Factory. All rights reserved.</Text>
        </div>
      </footer>
    </div>
  );
}
