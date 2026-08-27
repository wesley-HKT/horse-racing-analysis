import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模擬加載數據
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])

  const racingStats = [
    { title: '今日比賽', value: 12, suffix: '場' },
    { title: '活躍馬匹', value: 246, suffix: '匹' },
    { title: 'AI預測準確率', value: 78.5, suffix: '%' },
    { title: '數據更新時間', value: '5分鐘前' },
  ]

  return (
    <div className="app">
      <header className="header">
        <h1>AI賽馬分析平台</h1>
        <div className="header-info">
          <span>上次更新: 2026-08-27 19:30</span>
        </div>
      </header>

      <div className="content">
        <div className="alert">
          <h3>系統正在開發中</h3>
          <p>AI賽馬分析平台正在積極開發中，部分功能可能暫時無法使用。</p>
        </div>

        <div className="stats-grid">
          {racingStats.map((stat, index) => (
            <div className="stat-card" key={index}>
              {loading ? (
                <div className="loading">加載中...</div>
              ) : (
                <>
                  <h3>{stat.title}</h3>
                  <div className="stat-value">
                    {typeof stat.value === 'number' 
                      ? stat.value.toLocaleString() 
                      : stat.value}
                    <span className="suffix">{stat.suffix}</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="main-content">
          <div className="race-analysis">
            <h2>今日重點賽事分析</h2>
            <p className="race-info">沙田賽馬場 - 第7場 | 1400米 | 草地 | 三班賽</p>
            
            <div className="prediction-section">
              <div className="prediction-header">
                <span className="prediction-title">熱門馬匹</span>
                <span className="prediction-rate">勝率預測</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '65%', backgroundColor: '#52c41a' }}></div>
              </div>
              <div className="prediction-details">
                <span>「金鎗六十」</span>
                <span>65%</span>
              </div>
            </div>

            <div className="prediction-section">
              <div className="prediction-header">
                <span className="prediction-title">冷門機會</span>
                <span className="prediction-rate">價值投注</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '35%', backgroundColor: '#1890ff' }}></div>
              </div>
              <div className="prediction-details">
                <span>「幸運傳奇」</span>
                <span>35%</span>
              </div>
            </div>
          </div>

          <div className="system-status">
            <h2>系統狀態</h2>
            <div className="status-item">
              <span>數據更新</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '85%', backgroundColor: '#1890ff' }}></div>
              </div>
            </div>
            <div className="status-item">
              <span>AI模型</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '100%', backgroundColor: '#52c41a' }}></div>
              </div>
            </div>
            <div className="status-item">
              <span>API服務</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '95%', backgroundColor: '#52c41a' }}></div>
              </div>
            </div>
            <div className="status-item">
              <span>數據庫連接</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '100%', backgroundColor: '#52c41a' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="features">
          <h2>項目功能預覽</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>AI預測模型</h3>
              <p>基於機器學習的賽馬勝率預測</p>
            </div>
            <div className="feature-card">
              <h3>數據可視化</h3>
              <p>豐富的圖表和數據分析工具</p>
            </div>
            <div className="feature-card">
              <h3>實時監控</h3>
              <p>實時賠率追蹤和異常檢測</p>
            </div>
            <div className="feature-card">
              <h3>歷史分析</h3>
              <p>歷史賽事數據深度分析</p>
            </div>
            <div className="feature-card">
              <h3>馬匹檔案</h3>
              <p>詳細的馬匹和騎師數據</p>
            </div>
            <div className="feature-card">
              <h3>API接口</h3>
              <p>完整的RESTful API服務</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>AI賽馬分析平台 © 2026 - 利用大數據和機器學習分析賽馬</p>
        <p>項目狀態: 開發中 | 版本: 1.0.0</p>
      </footer>
    </div>
  )
}

export default App