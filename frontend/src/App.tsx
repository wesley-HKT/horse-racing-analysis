import { type ReactNode, useMemo, useState } from 'react'
import { useResearchSummary } from './hooks/useResearchSummary'
import RecentRaces from './pages/RecentRaces/RecentRaces'
import type { HistoricalMetrics } from './types/researchSummary'
import './App.css'

type ViewId = 'command' | 'race-lab' | 'recent-races' | 'backtest' | 'live' | 'data'
type MarketMode = 'win' | 'place'
type Confidence = 'High' | 'Medium' | 'Watch'

type NavigationItem = {
  id: ViewId
  label: string
  subtitle: string
  icon: string
}

type Race = {
  id: string
  number: number
  venue: string
  time: string
  raceClass: string
  distance: number
  course: string
  going: string
  runners: number
}

type Runner = {
  number: number
  draw: number
  name: string
  jockey: string
  trainer: string
  rating: number
  weight: number
  odds: number
  win: number
  place: number
  edge: number
  pace: number
  track: number
  form: string
  confidence: Confidence
  signal: string
  note: string
}

const navigation: NavigationItem[] = [
  { id: 'command', label: 'Command Centre', subtitle: '賽日總覽', icon: '⌂' },
  { id: 'race-lab', label: 'Race Lab', subtitle: '單場深度分析', icon: '◎' },
  { id: 'recent-races', label: 'Recent Races', subtitle: '近期賽事快照', icon: '↻' },
  { id: 'backtest', label: 'Backtest Studio', subtitle: '歷史驗證', icon: '↗' },
  { id: 'live', label: 'Live Monitor', subtitle: '即時資料狀態', icon: '◉' },
  { id: 'data', label: 'Data Vault', subtitle: '資料治理', icon: '▦' },
]

const races: Race[] = [
  { id: 'st-07', number: 7, venue: '沙田', time: '16:05', raceClass: '第三班', distance: 1400, course: '草地 C+3', going: '好地', runners: 12 },
  { id: 'st-08', number: 8, venue: '沙田', time: '16:40', raceClass: '第二班', distance: 1200, course: '草地 C+3', going: '好地', runners: 12 },
  { id: 'st-09', number: 9, venue: '沙田', time: '17:15', raceClass: '第三班', distance: 1600, course: '草地 C+3', going: '好地', runners: 14 },
]

const runners: Runner[] = [
  { number: 1, draw: 4, name: '星耀未來', jockey: '潘頓', trainer: '蔡約翰', rating: 91, weight: 135, odds: 2.8, win: 28.4, place: 62.8, edge: 6.3, pace: 91, track: 88, form: '2 · 1 · 3 · 2 · 4', confidence: 'High', signal: '模型首選', note: '近三仗保持穩定，步速形勢有利，檔位可守好位。' },
  { number: 6, draw: 7, name: '青雲直上', jockey: '布文', trainer: '呂健威', rating: 86, weight: 129, odds: 7.2, win: 16.9, place: 43.5, edge: 4.7, pace: 84, track: 82, form: '5 · 2 · 6 · 1 · 3', confidence: 'High', signal: '價值訊號', note: '市場定價較模型保守；中段若能取得遮擋，末段具上升空間。' },
  { number: 3, draw: 2, name: '競駿光輝', jockey: '巴度', trainer: '文家良', rating: 88, weight: 132, odds: 5.4, win: 15.7, place: 41.2, edge: 1.8, pace: 78, track: 90, form: '3 · 4 · 2 · 5 · 2', confidence: 'Medium', signal: '場地適性', note: '同程同地表現突出，內檔有利，但早段速度未必足以佔先。' },
  { number: 9, draw: 10, name: '超勁勇士', jockey: '艾道拿', trainer: '方嘉柏', rating: 82, weight: 126, odds: 12.0, win: 10.8, place: 31.6, edge: 2.5, pace: 86, track: 70, form: '8 · 3 · 7 · 4 · 1', confidence: 'Medium', signal: '步速受惠', note: '預計快步速有利後上；外檔增加走位不確定性。' },
  { number: 2, draw: 1, name: '飛輪閃耀', jockey: '何澤堯', trainer: '沈集成', rating: 89, weight: 133, odds: 9.6, win: 9.4, place: 29.7, edge: -1.0, pace: 72, track: 85, form: '4 · 6 · 5 · 2 · 7', confidence: 'Watch', signal: '價格偏低', note: '內檔節省腳程，但模型價格低於市場，暫列觀察。' },
  { number: 11, draw: 12, name: '紅運先鋒', jockey: '田泰安', trainer: '大衛希斯', rating: 78, weight: 122, odds: 18.0, win: 6.3, place: 20.4, edge: 0.7, pace: 68, track: 63, form: '7 · 9 · 4 · 8 · 5', confidence: 'Watch', signal: '資料不足', note: '外檔、同程樣本及近期狀態均降低模型信心。' },
]

const formatPercent = (value: number) => `${value.toFixed(1)}%`
const formatInteger = (value: number) => new Intl.NumberFormat('en-US').format(value)
const formatHitRate = (value: number) => `${value.toFixed(2)}%`

function DataBadge({ type }: { type: 'historical' | 'simulation' | 'offline' }) {
  const labels = {
    historical: ['HISTORICAL', '已匯入真實歷史資料'],
    simulation: ['SIMULATION', '賽日數值為模擬展示'],
    offline: ['FEED OFFLINE', '尚未接駁授權即時資料'],
  }
  return (
    <span className={`data-badge data-badge--${type}`}>
      <i />
      <b>{labels[type][0]}</b>
      <span>{labels[type][1]}</span>
    </span>
  )
}

function SectionTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="section-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description && <p className="section-description">{description}</p>}
      </div>
      {action && <div className="section-action">{action}</div>}
    </div>
  )
}

function MetricCard({ label, value, detail, tone = 'neutral', footnote }: { label: string; value: string; detail: string; tone?: 'neutral' | 'positive' | 'warning' | 'blue'; footnote?: string }) {
  return (
    <article className={`metric metric--${tone}`}>
      <div className="metric-label"><span>{label}</span><i /></div>
      <strong>{value}</strong>
      <p>{detail}</p>
      {footnote && <small>{footnote}</small>}
    </article>
  )
}

function ProbabilityBar({ value, tone = 'mint' }: { value: number; tone?: 'mint' | 'blue' | 'amber' }) {
  return (
    <div className="probability-bar">
      <span><i className={`bar-${tone}`} style={{ width: `${Math.min(value * 1.55, 100)}%` }} /></span>
      <strong>{formatPercent(value)}</strong>
    </div>
  )
}

function RaceSelector({ selectedRaceId, onSelect }: { selectedRaceId: string; onSelect: (raceId: string) => void }) {
  return (
    <div className="race-selector">
      {races.map((race) => (
        <button className={selectedRaceId === race.id ? 'active' : ''} key={race.id} onClick={() => onSelect(race.id)} type="button">
          <span className="race-number">R{race.number}</span>
          <span><b>{race.time}</b><small>{race.raceClass} · {race.distance}M</small></span>
          <em>{race.runners} 匹</em>
        </button>
      ))}
    </div>
  )
}

function RunnerTable({ marketMode, setMarketMode, selectedRunner, setSelectedRunner, showAll, setShowAll }: {
  marketMode: MarketMode
  setMarketMode: (mode: MarketMode) => void
  selectedRunner: number
  setSelectedRunner: (number: number) => void
  showAll: boolean
  setShowAll: (value: boolean) => void
}) {
  const shown = showAll ? runners : runners.filter((runner) => runner.confidence !== 'Watch')
  return (
    <section className="surface runner-surface">
      <SectionTitle
        eyebrow="RUNNER INTELLIGENCE MATRIX"
        title="全場馬匹模型比較"
        description="排序整合賽前條件、歷史特徵及模型輸出；目前賽日數值均為模擬展示。"
        action={(
          <div className="table-actions">
            <div className="segmented-control">
              <button className={marketMode === 'win' ? 'active' : ''} onClick={() => setMarketMode('win')} type="button">勝出機率</button>
              <button className={marketMode === 'place' ? 'active' : ''} onClick={() => setMarketMode('place')} type="button">位置機率</button>
            </div>
            <button className="secondary-button" onClick={() => setShowAll(!showAll)} type="button">{showAll ? '只顯示模型訊號' : '顯示全部馬匹'}</button>
          </div>
        )}
      />
      <div className="table-wrap">
        <table className="runner-table">
          <thead><tr><th>馬匹</th><th>騎師 / 練馬師</th><th>近績</th><th>評分 / 負磅</th><th>市場賠率</th><th>{marketMode === 'win' ? '勝出' : '位置'}機率</th><th>模型差距</th><th>訊號</th></tr></thead>
          <tbody>
            {shown.map((runner) => {
              const probability = marketMode === 'win' ? runner.win : runner.place
              return (
                <tr className={selectedRunner === runner.number ? 'selected' : ''} key={runner.number} onClick={() => setSelectedRunner(runner.number)}>
                  <td><div className="runner-name"><span className={`cloth cloth-${runner.number}`}>{runner.number}</span><div><strong>{runner.name}</strong><small>檔位 {runner.draw}</small></div></div></td>
                  <td><strong>{runner.jockey}</strong><small>{runner.trainer}</small></td>
                  <td><span className="form-string">{runner.form}</span></td>
                  <td><strong>{runner.rating}</strong><small>{runner.weight} 磅</small></td>
                  <td><strong className="mono odds-value">{runner.odds.toFixed(1)}</strong></td>
                  <td><ProbabilityBar value={probability} tone={runner.confidence === 'High' ? 'mint' : 'blue'} /></td>
                  <td><span className={`edge ${runner.edge >= 0 ? 'positive' : 'negative'}`}>{runner.edge >= 0 ? '+' : ''}{runner.edge.toFixed(1)}%</span></td>
                  <td><span className={`signal signal-${runner.confidence.toLowerCase()}`}>{runner.signal}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function CommandCentre({ historicalMetrics, selectedRaceId, onSelectRace, openRaceLab }: { historicalMetrics: HistoricalMetrics; selectedRaceId: string; onSelectRace: (raceId: string) => void; openRaceLab: () => void }) {
  const selectedRace = races.find((race) => race.id === selectedRaceId) ?? races[0]
  return (
    <div className="view-stack">
      <header className="page-hero command-hero">
        <div>
          <p className="eyebrow accent">RACING INTELLIGENCE OPERATING SYSTEM</p>
          <h1>香港賽馬 AI 指揮中心</h1>
          <p className="hero-copy">整合賽日分析、模型解釋、歷史回測及資料治理。每個數字都標示來源狀態，避免把模擬賽日訊號與真實歷史數據混淆。</p>
          <div className="badge-row"><DataBadge type="historical" /><DataBadge type="simulation" /></div>
        </div>
        <div className="hero-date"><span>研究資料版本</span><strong>2018.06</strong><small>來源提交 {historicalMetrics.commit}</small></div>
      </header>

      <RaceSelector selectedRaceId={selectedRaceId} onSelect={onSelectRace} />

      <section className="metric-grid four-up">
        <MetricCard label="歷史出賽紀錄" value={formatInteger(historicalMetrics.records)} detail="已正規化香港馬匹出賽紀錄" tone="blue" footnote="真實歷史研究資料" />
        <MetricCard label="可評估賽事" value={formatInteger(historicalMetrics.races)} detail="通過最低歷史資料門檻" tone="positive" footnote="無前視時間順序回測" />
        <MetricCard label="Top-1 命中" value={formatHitRate(historicalMetrics.topOne)} detail="歷史勝率平滑基準" footnote="不是正式 AI 模型" />
        <MetricCard label="Top-3 含冠軍" value={formatHitRate(historicalMetrics.topThree)} detail="三匹最高評分馬包含冠軍" tone="warning" footnote="截至 2018 年資料" />
      </section>

      <section className="command-grid">
        <article className="surface featured-analysis">
          <SectionTitle eyebrow="NEXT RACE BRIEFING" title={`R${selectedRace.number} · ${selectedRace.venue} ${selectedRace.distance}米`} description={`${selectedRace.time} · ${selectedRace.raceClass} · ${selectedRace.course} · ${selectedRace.going}`} action={<DataBadge type="simulation" />} />
          <div className="lead-runner">
            <span className="cloth cloth-1 large">1</span>
            <div className="lead-copy"><span>模型排名第一</span><h3>{runners[0].name}</h3><p>{runners[0].jockey} · {runners[0].trainer} · 檔 {runners[0].draw}</p></div>
            <div className="lead-probability"><span>模擬勝出機率</span><strong>{formatPercent(runners[0].win)}</strong><small>模型差距 +{runners[0].edge}%</small></div>
          </div>
          <div className="insight-list">
            <div><span className="insight-icon mint">01</span><p><strong>步速判斷</strong>預計早段偏快，跟前及中置馬匹較有利。</p></div>
            <div><span className="insight-icon blue">02</span><p><strong>價值候選</strong>青雲直上的模擬模型價格高於市場隱含機率。</p></div>
            <div><span className="insight-icon amber">03</span><p><strong>主要風險</strong>外檔馬匹的走位與中段節奏增加情景不確定度。</p></div>
          </div>
          <button className="primary-button" onClick={openRaceLab} type="button">進入 Race Lab <span>→</span></button>
        </article>

        <article className="surface model-health">
          <SectionTitle eyebrow="MODEL GOVERNANCE" title="模型與資料健康度" description="生產平台需要同時監控模型、資料及即時連線。" />
          <div className="health-list">
            <div><span><i className="health-ok" />歷史資料匯入</span><strong>Ready</strong><small>273,993 records</small></div>
            <div><span><i className="health-ok" />回測完整性</span><strong>Passed</strong><small>Chronological split</small></div>
            <div><span><i className="health-warn" />正式 AI 模型</span><strong>Baseline</strong><small>Feature model pending</small></div>
            <div><span><i className="health-off" />即時資料供應商</span><strong>Offline</strong><small>Licensed API required</small></div>
          </div>
          <div className="governance-note"><b>Deployment gate</b><p>正式預測上線前，必須通過資料新鮮度、機率校準、漂移監控及模型版本審批。</p></div>
        </article>
      </section>

      <section className="surface pipeline-overview">
        <SectionTitle eyebrow="PLATFORM WORKFLOW" title="從資料到決策的完整流程" description="這是平台實際需要完成的生產級處理鏈，而不只是一個預測百分比。" />
        <div className="pipeline-steps">
          {[
            ['01', '資料接入', '歷史賽果、出馬表、場地及授權賠率'],
            ['02', '品質檢查', '欄位漂移、缺失值、時間與身份對應'],
            ['03', '特徵計算', '近況、路程適性、騎練組合及步速'],
            ['04', '模型推論', '機率校準、情景分析及不確定度'],
            ['05', '監控與回測', '命中率、漂移、資料延遲及版本比較'],
          ].map(([number, title, text]) => <div key={number}><span>{number}</span><strong>{title}</strong><p>{text}</p></div>)}
        </div>
      </section>
    </div>
  )
}

function RaceLab({ selectedRaceId, onSelectRace }: { selectedRaceId: string; onSelectRace: (raceId: string) => void }) {
  const [marketMode, setMarketMode] = useState<MarketMode>('win')
  const [selectedRunner, setSelectedRunner] = useState(1)
  const [showAll, setShowAll] = useState(false)
  const race = races.find((item) => item.id === selectedRaceId) ?? races[0]
  const runner = runners.find((item) => item.number === selectedRunner) ?? runners[0]

  return (
    <div className="view-stack">
      <header className="page-header">
        <div><p className="eyebrow accent">RACE-SPECIFIC MODEL WORKSPACE</p><h1>Race Lab · 單場深度分析</h1><p>拆解賽事形勢、馬匹機率、模型因子與不確定度，而不是只提供單一排名。</p></div>
        <DataBadge type="simulation" />
      </header>
      <RaceSelector selectedRaceId={selectedRaceId} onSelect={onSelectRace} />

      <section className="race-context surface">
        <div className="race-identity"><span>R{race.number}</span><div><small>{race.venue}馬場</small><h2>{race.raceClass} · {race.distance}米</h2><p>{race.course} · {race.going} · {race.runners} 匹出賽</p></div></div>
        <div className="context-stat"><span>開跑時間</span><strong>{race.time}</strong></div>
        <div className="context-stat"><span>預測步速</span><strong className="mint-text">偏快</strong></div>
        <div className="context-stat"><span>模型不確定度</span><strong className="amber-text">中等</strong></div>
        <div className="context-stat"><span>即時賠率</span><strong className="muted-text">未接駁</strong></div>
      </section>

      <section className="metric-grid four-up">
        <MetricCard label="模型首選" value={runners[0].name} detail={`${formatPercent(runners[0].win)} 模擬勝出機率`} tone="positive" />
        <MetricCard label="最高價值差距" value="+6.3%" detail="模型機率減市場隱含機率" tone="blue" />
        <MetricCard label="高信心候選" value="2 匹" detail="同時通過形勢與資料品質門檻" />
        <MetricCard label="情景覆蓋" value="3 組" detail="快步速、均速、慢步速" tone="warning" />
      </section>

      <section className="lab-grid">
        <article className="surface pace-map">
          <SectionTitle eyebrow="PACE SCENARIO" title="預測步速與走位地圖" description="模擬不同階段的相對位置及賽事壓力。" />
          <div className="track-map">
            <div className="track-lane lane-front"><span>領放</span><i className="horse-dot horse-9">9</i><i className="horse-dot horse-6">6</i></div>
            <div className="track-lane lane-stalk"><span>跟前</span><i className="horse-dot horse-1">1</i><i className="horse-dot horse-3">3</i></div>
            <div className="track-lane lane-mid"><span>中置</span><i className="horse-dot horse-2">2</i></div>
            <div className="track-lane lane-back"><span>後上</span><i className="horse-dot horse-11">11</i></div>
          </div>
          <div className="scenario-summary"><div><span>早段</span><strong>競放壓力高</strong></div><div><span>中段</span><strong>節奏回穩</strong></div><div><span>直路</span><strong>後勁決勝</strong></div></div>
        </article>

        <article className="surface factor-panel">
          <SectionTitle eyebrow="EXPLAINABILITY" title="模型因子貢獻" description={`目前選擇：${runner.name}`} />
          <div className="factor-list">
            {[
              ['近三仗狀態', 84, '+18.2'],
              ['同程同地適性', runner.track, '+14.6'],
              ['騎師與練馬師組合', 72, '+9.4'],
              ['檔位與預測步速', runner.pace, '+8.1'],
              ['負磅相對變化', 48, '-2.7'],
            ].map(([label, score, impact]) => (
              <div className="factor-row" key={String(label)}><div><span>{label}</span><strong className={String(impact).startsWith('-') ? 'negative-text' : 'mint-text'}>{impact}</strong></div><div className="factor-track"><i style={{ width: `${score}%` }} /></div></div>
            ))}
          </div>
        </article>
      </section>

      <RunnerTable marketMode={marketMode} setMarketMode={setMarketMode} selectedRunner={selectedRunner} setSelectedRunner={setSelectedRunner} showAll={showAll} setShowAll={setShowAll} />

      <section className="runner-detail-grid">
        <article className="surface selected-runner-card">
          <SectionTitle eyebrow="SELECTED RUNNER" title={`${runner.number}. ${runner.name}`} description={`${runner.jockey} · ${runner.trainer} · 評分 ${runner.rating} · 負磅 ${runner.weight}`} />
          <p className="runner-note">{runner.note}</p>
          <div className="runner-score-grid"><div><span>步速適配</span><strong>{runner.pace}</strong></div><div><span>場地適性</span><strong>{runner.track}</strong></div><div><span>勝出機率</span><strong>{formatPercent(runner.win)}</strong></div><div><span>位置機率</span><strong>{formatPercent(runner.place)}</strong></div></div>
        </article>
        <article className="surface model-caveat">
          <SectionTitle eyebrow="DECISION DISCIPLINE" title="分析限制與風險" />
          <ul><li>賽日馬匹、賠率與機率目前為模擬展示。</li><li>真正推論必須使用最新出馬表、場地及授權市場資料。</li><li>模型排名不等於結果保證，亦不構成投注建議。</li></ul>
        </article>
      </section>
    </div>
  )
}

function BacktestStudio({ historicalMetrics }: { historicalMetrics: HistoricalMetrics }) {
  const bars = [10.8, 12.4, 13.2, 14.1, 13.8, 15.2, 14.7, 15.8, 14.9, 14.5, 15.1, historicalMetrics.topOne]
  return (
    <div className="view-stack">
      <header className="page-header">
        <div><p className="eyebrow accent">HISTORICAL VALIDATION & MODEL GOVERNANCE</p><h1>Backtest Studio · 歷史驗證中心</h1><p>用時間順序評估模型，檢查前視偏差、命中率與資料覆蓋，而不是以單一漂亮數字包裝模型。</p></div>
        <DataBadge type="historical" />
      </header>

      <section className="backtest-banner surface">
        <div><span>目前基準</span><h2>Chronological Horse Win-rate Baseline</h2><p>Beta(1,9) 平滑 · 每場只使用該馬較早賽事資料 · 不使用當場結果或最終賠率作為特徵</p></div>
        <div className="version-block"><span>DATA VERSION</span><strong>{historicalMetrics.commit}</strong><small>{historicalMetrics.period}</small></div>
      </section>

      <section className="metric-grid four-up">
        <MetricCard label="歷史出賽紀錄" value={formatInteger(historicalMetrics.records)} detail="正規化香港賽事 runners" tone="blue" />
        <MetricCard label="評估賽事" value={formatInteger(historicalMetrics.races)} detail="符合最低歷史門檻" tone="positive" />
        <MetricCard label="Top-1 勝出命中" value={formatHitRate(historicalMetrics.topOne)} detail="模型第一名實際勝出" />
        <MetricCard label="Top-3 含冠軍" value={formatHitRate(historicalMetrics.topThree)} detail="前三評分包含冠軍" tone="warning" />
      </section>

      <section className="backtest-grid">
        <article className="surface performance-chart">
          <SectionTitle eyebrow="ROLLING DIAGNOSTIC" title="滾動 Top-1 命中率" description="視覺用於展示生產平台的監控方式；目前僅總體 14.54% 為已驗證聚合值。" />
          <div className="chart-area">
            <div className="chart-y"><span>18%</span><span>12%</span><span>6%</span><span>0%</span></div>
            <div className="bar-series">{bars.map((bar, index) => <div key={index}><i style={{ height: `${bar * 4.2}px` }} /><span>{index + 1}</span></div>)}</div>
          </div>
          <div className="chart-legend"><span><i className="legend-mint" />示意滾動視窗</span><span><i className="legend-line" />已驗證總體 {formatHitRate(historicalMetrics.topOne)}</span></div>
        </article>

        <article className="surface validation-card">
          <SectionTitle eyebrow="LEAKAGE CONTROL" title="驗證規則" description="任何正式模型都必須通過以下閘門。" />
          <div className="validation-list">
            <div><span>01</span><p><strong>時間切分</strong>訓練、驗證及測試依賽季排序。</p><b>PASS</b></div>
            <div><span>02</span><p><strong>特徵可用時間</strong>禁止使用賽後結果或未來統計。</p><b>PASS</b></div>
            <div><span>03</span><p><strong>機率校準</strong>需檢查 Brier score 與校準曲線。</p><b className="pending">NEXT</b></div>
            <div><span>04</span><p><strong>資料漂移</strong>監控場地、班次及馬匹群組變化。</p><b className="pending">NEXT</b></div>
          </div>
        </article>
      </section>

      <section className="surface methodology">
        <SectionTitle eyebrow="REPRODUCIBLE RESEARCH" title="回測流程與下一代模型" description="現有流程已證明資料可被安全匯入與時間排序評估；下一步才是正式特徵模型。" />
        <div className="method-grid">
          <div><span>01</span><h3>Raw results</h3><p>固定來源 commit、SHA-256 與欄位清單。</p></div>
          <div><span>02</span><h3>Normalisation</h3><p>273,993 筆香港 runners 寫入本機 SQLite。</p></div>
          <div><span>03</span><h3>Chronological split</h3><p>每一場只使用更早的馬匹歷史。</p></div>
          <div><span>04</span><h3>Feature model</h3><p>加入近況、路程、騎練、負磅及檔位。</p></div>
          <div><span>05</span><h3>Calibration</h3><p>評估機率可信度及跨賽季穩定性。</p></div>
        </div>
      </section>

      <div className="research-warning"><span>!</span><p><strong>研究限制</strong>資料最晚至 2018 年；現有結果不是即時模型效能，也不代表投注回報。正式平台需加入授權的新賽季資料並重新訓練。</p></div>
    </div>
  )
}

function LiveMonitor() {
  return (
    <div className="view-stack">
      <header className="page-header">
        <div><p className="eyebrow accent">RACE-DAY OPERATIONS</p><h1>Live Monitor · 即時分析控制台</h1><p>監控資料延遲、出馬表變更、模型推論與市場訊號。現階段尚未連接授權即時資料。</p></div>
        <DataBadge type="offline" />
      </header>

      <section className="offline-hero surface">
        <div className="offline-symbol"><span>◉</span></div>
        <div><p className="eyebrow">LIVE FEED STATUS</p><h2>等待授權資料供應商</h2><p>GitHub Pages 無法安全儲存 API 金鑰或持續執行 Python。即時功能需要獨立後端、祕密管理、排程及 WebSocket／輪詢服務。</p></div>
        <button className="secondary-button" type="button">查看接入規格</button>
      </section>

      <section className="metric-grid four-up">
        <MetricCard label="Race card feed" value="Offline" detail="需要最新出馬表與退出馬匹" tone="warning" />
        <MetricCard label="Odds feed" value="Offline" detail="需要授權 Win / Place 市場資料" tone="warning" />
        <MetricCard label="Inference API" value="Not deployed" detail="模型工件與特徵服務尚未上線" />
        <MetricCard label="Frontend heartbeat" value="Online" detail="GitHub Pages 靜態介面正常" tone="positive" />
      </section>

      <section className="live-grid">
        <article className="surface integration-plan">
          <SectionTitle eyebrow="INTEGRATION BLUEPRINT" title="即時分析需要的六個服務" description="每個服務都必須可監控、可重試及保留來源時間戳。" />
          <div className="service-list">
            {[
              ['01', '授權賽日資料', '出馬表、退出、檔位、負磅、配備及場地狀況', 'Required'],
              ['02', '授權市場資料', 'Win / Place 賠率、擷取時間與市場狀態', 'Required'],
              ['03', 'Feature Service', '以歷史資料和當日條件計算一致特徵', 'Build'],
              ['04', 'Inference Service', '載入已審批模型並輸出校準機率', 'Build'],
              ['05', 'Event Stream', 'WebSocket 或短輪詢推送變更與警報', 'Build'],
              ['06', 'Audit Log', '保存輸入版本、模型版本與每次推論結果', 'Build'],
            ].map(([number, title, text, status]) => <div key={number}><span>{number}</span><p><strong>{title}</strong>{text}</p><b className={status === 'Required' ? 'required' : ''}>{status}</b></div>)}
          </div>
        </article>

        <article className="surface readiness-card">
          <SectionTitle eyebrow="GO-LIVE CHECKLIST" title="生產上線閘門" />
          <div className="readiness-score"><strong>28%</strong><span>Platform readiness</span><div><i style={{ width: '28%' }} /></div></div>
          <ul className="checklist"><li className="done">歷史匯入與來源追蹤</li><li className="done">靜態分析工作區</li><li>合法即時資料合約</li><li>後端雲端部署</li><li>模型訓練與校準</li><li>漂移與延遲警報</li></ul>
        </article>
      </section>

      <section className="surface event-console">
        <SectionTitle eyebrow="EVENT STREAM" title="即時事件記錄" description="接駁資料供應商後，出馬表、賠率、場地及模型更新會在此顯示。" />
        <div className="console-empty"><span>NO LIVE EVENTS</span><p>Historical research remains available in Backtest Studio.</p></div>
      </section>
    </div>
  )
}

function DataVault({ historicalMetrics }: { historicalMetrics: HistoricalMetrics }) {
  return (
    <div className="view-stack">
      <header className="page-header">
        <div><p className="eyebrow accent">DATA LINEAGE & QUALITY</p><h1>Data Vault · 資料治理中心</h1><p>追蹤資料版本、欄位、完整性、保存位置與授權狀態，讓模型輸出可以被重現與審計。</p></div>
        <DataBadge type="historical" />
      </header>

      <section className="provenance-card surface">
        <div className="provenance-main"><p className="eyebrow">ACTIVE RESEARCH DATASET</p><h2>Hong Kong historical performance records</h2><p>第三方研究資料 · 僅本機使用 · 不提交至公開 GitHub · 不由前端提供原始記錄</p><div className="provenance-tags"><span>CSV.GZ</span><span>SQLite</span><span>SHA-256</span><span>Local only</span></div></div>
        <div className="commit-block"><span>SOURCE COMMIT</span><strong>70b86e9944a0</strong><small>{historicalMetrics.period}</small></div>
      </section>

      <section className="metric-grid four-up">
        <MetricCard label="香港出賽記錄" value={formatInteger(historicalMetrics.records)} detail="已正規化 runners" tone="blue" />
        <MetricCard label="資料欄位" value="37" detail="來源 performance schema" />
        <MetricCard label="來源檔案" value="6" detail="賽果、賽事、馬匹、分段及賠率" tone="positive" />
        <MetricCard label="資料新鮮度" value="Historical" detail="最晚至 2018-06-27" tone="warning" />
      </section>

      <section className="data-grid">
        <article className="surface schema-card">
          <SectionTitle eyebrow="NORMALISED SCHEMA" title="模型可用欄位群組" description="正式特徵會按可用時間再作篩選，防止資料洩漏。" />
          <div className="schema-groups">
            {[
              ['Race identity', 'race_key, race_date, race_number'],
              ['Runner identity', 'horse_id, horse_name, draw'],
              ['Connections', 'jockey_name, trainer_name'],
              ['Race conditions', 'distance, track, going, race_class'],
              ['Physical inputs', 'actual_weight, rating'],
              ['Outcome fields', 'finish_position, winning_odds'],
            ].map(([title, fields]) => <div key={title}><span>{title}</span><code>{fields}</code></div>)}
          </div>
        </article>

        <article className="surface quality-card">
          <SectionTitle eyebrow="QUALITY CONTROLS" title="資料品質狀態" />
          <div className="quality-list"><div><span>來源 commit 已固定</span><b>PASS</b></div><div><span>檔案 SHA-256 已記錄</span><b>PASS</b></div><div><span>非香港記錄已排除</span><b>PASS</b></div><div><span>缺失結果已跳過</span><b>PASS</b></div><div><span>最新賽季覆蓋</span><b className="warn">STALE</b></div><div><span>資料再散布授權</span><b className="warn">REVIEW</b></div></div>
        </article>
      </section>

      <section className="surface file-map">
        <SectionTitle eyebrow="LOCAL STORAGE MAP" title="資料隔離與產出" description="所有第三方資料與衍生報告均留在 Git 忽略的本機目錄。" />
        <div className="file-tree"><p><span>▾</span> .local-research/</p><p className="level-1"><span>▸</span> upstream/horserace_data/ <em>raw source checkout</em></p><p className="level-1"><span>•</span> provenance.json <em>commit + hashes + schema</em></p><p className="level-1"><span>▾</span> imports/</p><p className="level-2"><span>•</span> normalized.sqlite <em>273,993 HK runners</em></p><p className="level-1"><span>▾</span> reports/</p><p className="level-2"><span>•</span> import-summary.json</p><p className="level-2"><span>•</span> backtest-summary.json</p></div>
      </section>

      <div className="research-warning"><span>!</span><p><strong>授權與用途</strong>第三方資料集未在其 repository 標示明確資料授權。正式商業或公開資料服務前，必須取得資料供應商許可並完成法律與合規審查。</p></div>
    </div>
  )
}

function App() {
  const [activeView, setActiveView] = useState<ViewId>('command')
  const [selectedRaceId, setSelectedRaceId] = useState(races[0].id)
  const { metrics: historicalMetrics } = useResearchSummary()
  const selectedNavigation = useMemo(() => navigation.find((item) => item.id === activeView) ?? navigation[0], [activeView])

  const content = {
    command: <CommandCentre historicalMetrics={historicalMetrics} selectedRaceId={selectedRaceId} onSelectRace={setSelectedRaceId} openRaceLab={() => setActiveView('race-lab')} />,
    'race-lab': <RaceLab selectedRaceId={selectedRaceId} onSelectRace={setSelectedRaceId} />,
    'recent-races': <RecentRaces />,
    backtest: <BacktestStudio historicalMetrics={historicalMetrics} />,
    live: <LiveMonitor />,
    data: <DataVault historicalMetrics={historicalMetrics} />,
  }[activeView]

  return (
    <div className="platform-shell">
      <aside className="platform-sidebar">
        <button className="brand" onClick={() => setActiveView('command')} type="button">
          <span className="brand-mark">R</span>
          <span className="brand-copy"><small>HK RACING INTELLIGENCE</small><strong>Racing<span>IQ</span></strong></span>
        </button>
        <div className="workspace-label">AI WORKSPACE</div>
        <nav>
          {navigation.map((item) => (
            <button className={activeView === item.id ? 'active' : ''} key={item.id} onClick={() => setActiveView(item.id)} type="button">
              <span className="nav-symbol">{item.icon}</span><span className="nav-copy"><strong>{item.label}</strong><small>{item.subtitle}</small></span>{(item.id === 'live' || item.id === 'recent-races') && <i className="offline-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-system">
          <div><span className="system-dot ready" /><p><strong>Historical engine</strong><small>Local research ready</small></p></div>
          <div><span className="system-dot offline" /><p><strong>Live data feed</strong><small>Not connected</small></p></div>
        </div>
        <div className="sidebar-footer"><span>RESEARCH BUILD</span><strong>v0.2.0</strong><small>Not betting advice</small></div>
      </aside>

      <main className="platform-main">
        <header className="platform-topbar">
          <div className="mobile-brand"><span className="brand-mark">R</span><strong>RacingIQ</strong></div>
          <div className="breadcrumb"><span>RacingIQ</span><b>/</b><strong>{selectedNavigation.label}</strong></div>
          <div className="topbar-right"><span className="environment"><i /> RESEARCH ENVIRONMENT</span><button className="notification-button" type="button">⌁<sup>2</sup></button><button className="user-button" type="button">WY</button></div>
        </header>
        <div className="mobile-navigation">
          {navigation.map((item) => <button className={activeView === item.id ? 'active' : ''} key={item.id} onClick={() => setActiveView(item.id)} type="button"><span>{item.icon}</span>{item.label}</button>)}
        </div>
        <div className="platform-content">{content}</div>
      </main>
    </div>
  )
}

export default App
