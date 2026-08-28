import { useMemo, useState } from 'react'
import './App.css'

type MarketMode = '勝出' | '位置'

type HorseRow = {
  draw: number
  number: number
  name: string
  jockey: string
  trainer: string
  odds: number
  winProbability: number
  placeProbability: number
  paceScore: number
  trackScore: number
  confidence: '高' | '中' | '觀察'
  signal: '模型首選' | '價值訊號' | '防守配置' | '持續觀察'
}

const navigation = [
  ['總覽', '◫'],
  ['賽事分析', '◌'],
  ['AI 模型', '⌁'],
  ['馬匹資料庫', '◇'],
  ['回測中心', '↗'],
]

const raceOptions = ['第 7 場 · 三班 · 1400m', '第 8 場 · 二班 · 1200m', '第 9 場 · 三班 · 1600m']

const horses: HorseRow[] = [
  { draw: 4, number: 1, name: '星耀未來', jockey: '潘頓', trainer: '蔡約翰', odds: 2.8, winProbability: 28.4, placeProbability: 62.8, paceScore: 91, trackScore: 88, confidence: '高', signal: '模型首選' },
  { draw: 7, number: 6, name: '青雲直上', jockey: '布文', trainer: '呂健威', odds: 7.2, winProbability: 16.9, placeProbability: 43.5, paceScore: 84, trackScore: 82, confidence: '高', signal: '價值訊號' },
  { draw: 2, number: 3, name: '競駿光輝', jockey: '巴度', trainer: '文家良', odds: 5.4, winProbability: 15.7, placeProbability: 41.2, paceScore: 78, trackScore: 90, confidence: '中', signal: '防守配置' },
  { draw: 10, number: 9, name: '超勁勇士', jockey: '艾道拿', trainer: '方嘉柏', odds: 12.0, winProbability: 10.8, placeProbability: 31.6, paceScore: 86, trackScore: 70, confidence: '中', signal: '價值訊號' },
  { draw: 1, number: 2, name: '飛輪閃耀', jockey: '何澤堯', trainer: '沈集成', odds: 9.6, winProbability: 9.4, placeProbability: 29.7, paceScore: 72, trackScore: 85, confidence: '觀察', signal: '持續觀察' },
  { draw: 12, number: 11, name: '紅運先鋒', jockey: '田泰安', trainer: '大衛希斯', odds: 18.0, winProbability: 6.3, placeProbability: 20.4, paceScore: 68, trackScore: 63, confidence: '觀察', signal: '持續觀察' },
]

const formatPercent = (value: number) => `${value.toFixed(1)}%`

function App() {
  const [activeNav, setActiveNav] = useState('總覽')
  const [selectedRace, setSelectedRace] = useState(raceOptions[0])
  const [marketMode, setMarketMode] = useState<MarketMode>('勝出')
  const [showAllRows, setShowAllRows] = useState(false)

  const displayedHorses = showAllRows ? horses : horses.filter((horse) => horse.confidence !== '觀察')
  const topHorse = horses[0]
  const totalWinProbability = useMemo(
    () => horses.reduce((total, horse) => total + horse.winProbability, 0),
    [],
  )

  const probabilityFor = (horse: HorseRow) =>
    marketMode === '勝出' ? horse.winProbability : horse.placeProbability

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="主要導覽">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">R</div>
          <div>
            <p className="eyebrow">RACE INTELLIGENCE</p>
            <strong>RACING<span>IQ</span></strong>
          </div>
        </div>

        <nav className="nav-list">
          <p className="nav-label">WORKSPACE</p>
          {navigation.map(([label, icon]) => (
            <button
              className={`nav-item ${activeNav === label ? 'is-active' : ''}`}
              key={label}
              onClick={() => setActiveNav(label)}
              type="button"
            >
              <span className="nav-icon" aria-hidden="true">{icon}</span>
              <span>{label}</span>
              {label === '賽事分析' && <span className="nav-count">3</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="data-pulse"><span /> 資料流運作中</div>
          <p>模型版本</p>
          <strong>RACE-FORM v1.0</strong>
          <small>示範介面 · 非即時資料</small>
        </div>
      </aside>

      <main className="dashboard">
        <header className="topbar">
          <div className="breadcrumb">
            <span>賽馬智能平台</span><b>/</b><strong>{activeNav}</strong>
          </div>
          <div className="topbar-actions">
            <span className="last-updated"><i /> 最後同步：示範資料</span>
            <button className="icon-button" aria-label="通知" type="button">⌁<sup>2</sup></button>
            <button className="avatar" aria-label="使用者選單" type="button">WY</button>
          </div>
        </header>

        <section className="page-heading">
          <div>
            <p className="eyebrow accent">MODEL-ASSISTED RACE ANALYSIS</p>
            <h1>賽事分析中心</h1>
            <p>以賽事條件、近況、騎練組合及市場訊號建立可解釋的機率觀點。</p>
          </div>
          <div className="race-selector-wrap">
            <label htmlFor="race-selector">目前賽事</label>
            <select
              id="race-selector"
              value={selectedRace}
              onChange={(event) => setSelectedRace(event.target.value)}
            >
              {raceOptions.map((race) => <option key={race}>{race}</option>)}
            </select>
          </div>
        </section>

        <section className="race-strip" aria-label="賽事條件">
          <div className="venue-block">
            <span className="venue-pin">●</span>
            <div><small>場地</small><strong>沙田馬場</strong></div>
          </div>
          <div className="race-meta"><small>開跑時間</small><strong>16:05</strong></div>
          <div className="race-meta"><small>途程</small><strong>1400 米</strong></div>
          <div className="race-meta"><small>跑道</small><strong>草地 · C+3</strong></div>
          <div className="race-meta"><small>場地狀況</small><strong className="condition"><i /> 好地</strong></div>
          <div className="race-clock"><span>距離開跑</span><strong>01:42:18</strong></div>
        </section>

        <section className="metrics-grid" aria-label="模型摘要">
          <article className="metric-card featured-metric">
            <div className="metric-top"><span>模型首選</span><b className="status-pill positive">高信心</b></div>
            <div className="featured-horse"><span className="silk">01</span><div><h2>{topHorse.name}</h2><p>{topHorse.jockey} · {topHorse.trainer}</p></div></div>
            <div className="metric-footer"><span>預測勝出率</span><strong>{formatPercent(topHorse.winProbability)}</strong><em>+6.3 市場差距</em></div>
          </article>
          <article className="metric-card">
            <div className="metric-top"><span>市場價值訊號</span><span className="sparkline up">╱╲╱</span></div>
            <strong className="metric-number">2 <small>匹</small></strong>
            <p>模型機率高於市場隱含機率</p>
            <div className="metric-footer"><span>最佳價值</span><strong>青雲直上</strong></div>
          </article>
          <article className="metric-card">
            <div className="metric-top"><span>模型覆蓋度</span><span className="status-dot" /></div>
            <strong className="metric-number">{formatPercent(totalWinProbability)}<small>*</small></strong>
            <p>已量化主要出賽馬匹的勝出分布</p>
            <div className="coverage-track"><span style={{ width: `${Math.min(totalWinProbability, 100)}%` }} /></div>
          </article>
          <article className="metric-card">
            <div className="metric-top"><span>賽事不確定度</span><span className="sparkline neutral">∿∿</span></div>
            <strong className="metric-number">中等</strong>
            <p>步速情景及中段位置為主要變數</p>
            <div className="metric-footer"><span>建議</span><strong>分散情景</strong></div>
          </article>
        </section>

        <section className="analysis-grid">
          <article className="panel pace-panel">
            <div className="panel-header">
              <div><p className="eyebrow">RACE SHAPE</p><h2>預測步速結構</h2></div>
              <button type="button" className="text-button">分析方法 <span>↗</span></button>
            </div>
            <div className="pace-chart" role="img" aria-label="預測步速由快至慢的分段圖">
              <div className="chart-axis"><span>快</span><span>均速</span><span>慢</span></div>
              <div className="pace-line"><span className="line-start" /><span className="line-mid" /><span className="line-end" /></div>
              <div className="pace-stages">
                <div><b>早段</b><strong>偏快</strong><small>領放壓力較高</small></div>
                <div><b>中段</b><strong>回穩</strong><small>有利跟前馬匹</small></div>
                <div><b>末段</b><strong>競爭</strong><small>直路衝刺決勝</small></div>
              </div>
            </div>
          </article>

          <article className="panel signal-panel">
            <div className="panel-header"><div><p className="eyebrow">KEY DRIVERS</p><h2>本場核心因子</h2></div><span className="model-tag">v1.0</span></div>
            <div className="drivers">
              <div className="driver"><div><span>場地適性</span><strong>+22%</strong></div><div className="driver-track"><i style={{ width: '82%' }} /></div></div>
              <div className="driver"><div><span>近三仗狀態</span><strong>+17%</strong></div><div className="driver-track"><i style={{ width: '67%' }} /></div></div>
              <div className="driver"><div><span>騎練組合</span><strong>+11%</strong></div><div className="driver-track"><i style={{ width: '48%' }} /></div></div>
              <div className="driver"><div><span>檔位與步速</span><strong>+8%</strong></div><div className="driver-track"><i style={{ width: '35%' }} /></div></div>
            </div>
          </article>
        </section>

        <section className="panel table-panel">
          <div className="table-heading">
            <div><p className="eyebrow">RUNNER MATRIX</p><h2>馬匹模型比較</h2><span>根據目前選取的賽事條件計算 · 示範資料</span></div>
            <div className="table-controls">
              <div className="segmented" aria-label="機率類型">
                {(['勝出', '位置'] as MarketMode[]).map((mode) => (
                  <button className={marketMode === mode ? 'selected' : ''} key={mode} onClick={() => setMarketMode(mode)} type="button">{mode}機率</button>
                ))}
              </div>
              <button className="outline-button" onClick={() => setShowAllRows((value) => !value)} type="button">
                {showAllRows ? '只看模型訊號' : '顯示全部馬匹'}
              </button>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead><tr><th>檔</th><th>馬號 / 馬匹</th><th>騎師 · 練馬師</th><th>市場賠率</th><th>{marketMode}機率</th><th>步速</th><th>場地</th><th>模型訊號</th></tr></thead>
              <tbody>
                {displayedHorses.map((horse, index) => (
                  <tr key={horse.number} className={index === 0 ? 'primary-row' : ''}>
                    <td><span className="draw">{horse.draw}</span></td>
                    <td><div className="horse-cell"><span className={`silk small-silk silk-${horse.number}`}>{horse.number.toString().padStart(2, '0')}</span><div><strong>{horse.name}</strong><small>評分 {92 - horse.number * 2}</small></div></div></td>
                    <td><span className="person">{horse.jockey}</span><small className="trainer">{horse.trainer}</small></td>
                    <td><strong className="odds">{horse.odds.toFixed(1)}</strong></td>
                    <td><div className="probability"><strong>{formatPercent(probabilityFor(horse))}</strong><span><i style={{ width: `${Math.min(probabilityFor(horse) * 2.3, 100)}%` }} /></span></div></td>
                    <td><span className={`score ${horse.paceScore >= 85 ? 'strong-score' : ''}`}>{horse.paceScore}</span></td>
                    <td><span className={`score ${horse.trackScore >= 85 ? 'strong-score' : ''}`}>{horse.trackScore}</span></td>
                    <td><span className={`signal ${horse.confidence === '高' ? 'signal-high' : horse.confidence === '中' ? 'signal-medium' : 'signal-watch'}`}>{horse.signal}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-note"><span>ⓘ</span> 本頁為產品設計展示，所有賽事、機率、賠率及訊號均為模擬資料，並非投注建議或即時預測。</div>
        </section>
      </main>
    </div>
  )
}

export default App