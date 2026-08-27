import { useState, useEffect } from 'react'
import { Layout, Menu, Typography, Card, Row, Col, Statistic, Progress, Alert } from 'antd'
import {
  HomeOutlined,
  BarChartOutlined,
  LineChartOutlined,
  DollarOutlined,
  TeamOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import './App.css'

const { Header, Content, Sider } = Layout
const { Title, Text } = Typography

function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模擬加載數據
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])

  const menuItems = [
    {
      key: '1',
      icon: <HomeOutlined />,
      label: '首頁',
    },
    {
      key: '2',
      icon: <BarChartOutlined />,
      label: '賽馬分析',
    },
    {
      key: '3',
      icon: <LineChartOutlined />,
      label: 'AI預測',
    },
    {
      key: '4',
      icon: <DollarOutlined />,
      label: '賠率分析',
    },
    {
      key: '5',
      icon: <TeamOutlined />,
      label: '馬匹數據',
    },
    {
      key: '6',
      icon: <SettingOutlined />,
      label: '系統設置',
    },
  ]

  const racingStats = [
    { title: '今日比賽', value: 12, suffix: '場' },
    { title: '活躍馬匹', value: 246, suffix: '匹' },
    { title: 'AI預測準確率', value: 78.5, suffix: '%' },
    { title: '數據更新時間', value: '5分鐘前' },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 64, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6 }} />
        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={menuItems} />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ padding: '0 24px', display: 'flex', alignItems: 'center', height: '100%' }}>
            <Title level={3} style={{ margin: 0 }}>AI賽馬分析平台</Title>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
              <Text type="secondary">上次更新: 2026-08-27 19:30</Text>
            </div>
          </div>
        </Header>
        <Content style={{ margin: '16px' }}>
          <Alert
            message="系統正在開發中"
            description="AI賽馬分析平台正在積極開發中，部分功能可能暫時無法使用。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Row gutter={[16, 16]}>
            {racingStats.map((stat, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card loading={loading}>
                  <Statistic
                    title={stat.title}
                    value={typeof stat.value === 'number' ? stat.value : stat.value}
                    suffix={stat.suffix}
                    precision={typeof stat.value === 'number' && stat.value % 1 !== 0 ? 1 : 0}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={16}>
              <Card title="今日重點賽事分析" loading={loading}>
                <div style={{ padding: 16 }}>
                  <Title level={4}>沙田賽馬場 - 第7場</Title>
                  <Text type="secondary">1400米 | 草地 | 三班賽</Text>
                  
                  <div style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong>熱門馬匹</Text>
                      <Text>勝率預測</Text>
                    </div>
                    <Progress percent={65} strokeColor="#52c41a" />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <Text>「金鎗六十」</Text>
                      <Text>65%</Text>
                    </div>
                  </div>

                  <div style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong>冷門機會</Text>
                      <Text>價值投注</Text>
                    </div>
                    <Progress percent={35} strokeColor="#1890ff" />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <Text>「幸運傳奇」</Text>
                      <Text>35%</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="系統狀態" loading={loading}>
                <div style={{ padding: 16 }}>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>數據更新</Text>
                    <Progress percent={85} status="active" />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>AI模型</Text>
                    <Progress percent={100} status="success" />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>API服務</Text>
                    <Progress percent={95} status="success" />
                  </div>
                  <div>
                    <Text strong>數據庫連接</Text>
                    <Progress percent={100} status="success" />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24}>
              <Card title="項目功能預覽" loading={loading}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8}>
                    <Card size="small" title="AI預測模型" bordered={false}>
                      <Text>基於機器學習的賽馬勝率預測</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Card size="small" title="數據可視化" bordered={false}>
                      <Text>豐富的圖表和數據分析工具</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Card size="small" title="實時監控" bordered={false}>
                      <Text>實時賠率追蹤和異常檢測</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Card size="small" title="歷史分析" bordered={false}>
                      <Text>歷史賽事數據深度分析</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Card size="small" title="馬匹檔案" bordered={false}>
                      <Text>詳細的馬匹和騎師數據</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Card size="small" title="API接口" bordered={false}>
                      <Text>完整的RESTful API服務</Text>
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App