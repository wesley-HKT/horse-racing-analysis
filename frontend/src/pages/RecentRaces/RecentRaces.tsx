import { useEffect, useMemo, useState } from 'react'
import { loadRecentRaces, recentRacesEnabled, type RecentRacesLoadResult } from '../../services/recentRaces'
import type { RecentRace, RecentRaceMeeting } from '../../types/recentRaces'

const initialStatus: RecentRacesLoadResult | { status: 'loading' } = recentRacesEnabled()
  ? { status: 'loading' }
  : { status: 'disabled' }

function displayDate(value: string | null) {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.valueOf()) ? value : new Intl.DateTimeFormat('zh-HK', { dateStyle: 'medium', timeZone: 'Asia/Hong_Kong' }).format(parsed)
}

function RaceResultTable({ race }: { race: RecentRace }) {
  const finishers = [...race.runners].sort((left, right) => (left.finish_position ?? 999) - (right.finish_position ?? 999))
  return (
    <div className="recent-race-card">
      <div className="recent-race-heading">
        <span>R{race.race_number ?? '—'}</span>
        <div><strong>{race.race_name_zh || race.race_name_en || '未命名賽事'}</strong><small>{race.distance_m ? `${race.distance_m}米` : '路程未提供'} · {race.going_zh || race.going_en || '場地未提供'} · {race.status}</small></div>
      </div>
      <div className="table-wrap">
        <table className="recent-result-table">
          <thead><tr><th>名次</th><th>馬匹</th><th>騎師 / 練馬師</th><th>檔位</th><th>評分</th><th>獨贏賠率</th><th>狀態</th></tr></thead>
          <tbody>
            {finishers.map((runner) => (
              <tr key={runner.runner_id || `${race.race_id}-${runner.horse_number}`}>
                <td><strong className={runner.finish_position && runner.finish_position <= 3 ? 'recent-podium' : ''}>{runner.finish_position ?? '—'}</strong></td>
                <td><strong>{runner.horse_number ?? '—'}. {runner.horse_name_zh || runner.horse_name_en || '未知馬匹'}</strong><small>{runner.recent_form ? `近績 ${runner.recent_form}` : '近績未提供'}</small></td>
                <td><strong>{runner.jockey_name_zh || runner.jockey_name_en || '—'}</strong><small>{runner.trainer_name_zh || runner.trainer_name_en || '—'}</small></td>
                <td>{runner.draw ?? '—'}</td><td>{runner.current_rating ?? '—'}</td><td>{runner.win_odds ?? '—'}</td><td>{runner.status}</td>
              </tr>
            ))}
            {finishers.length === 0 && <tr><td colSpan={7}>此快照沒有馬匹結果。</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MeetingPanel({ meeting }: { meeting: RecentRaceMeeting }) {
  return (
    <section className="surface recent-meeting">
      <div className="recent-meeting-header">
        <div><p className="eyebrow">NORMALISED MEETING SNAPSHOT</p><h2>{meeting.venue_name_zh} · {displayDate(meeting.meeting_date)}</h2><p>{meeting.venue_name_en} · {meeting.status} · {meeting.races.length} 場已載入</p></div>
        <span className="recent-status-chip">SNAPSHOT</span>
      </div>
      <div className="recent-race-list">{meeting.races.map((race) => <RaceResultTable key={race.race_id} race={race} />)}</div>
    </section>
  )
}

export default function RecentRaces() {
  const [result, setResult] = useState<RecentRacesLoadResult | { status: 'loading' }>(initialStatus)

  useEffect(() => {
    if (!recentRacesEnabled()) return undefined
    const controller = new AbortController()
    loadRecentRaces(controller.signal).then(setResult).catch((error) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setResult({ status: 'unavailable', message: error instanceof Error ? error.message : 'Snapshot could not be loaded.' })
      }
    })
    return () => controller.abort()
  }, [])

  const summary = useMemo(() => {
    if (result.status !== 'ready') return null
    const races = result.snapshot.meetings.flatMap((meeting) => meeting.races)
    return {
      meetings: result.snapshot.meetings.length,
      races: races.length,
      runners: races.reduce((total, race) => total + race.runners.length, 0),
    }
  }, [result])

  return (
    <div className="view-stack">
      <header className="page-header">
        <div><p className="eyebrow accent">EXPERIMENTAL RECENT-RACE SNAPSHOTS</p><h1>Recent Races · 最新賽事</h1><p>只讀取經本機正規化及人工審閱的快照；瀏覽器不會直接連接 HKJC，也不會把展示或歷史資料冒充最新賽果。</p></div>
        <span className="recent-source-badge"><i />UNOFFICIAL · REVIEW REQUIRED</span>
      </header>

      {result.status === 'disabled' && (
        <section className="surface recent-empty-state">
          <span className="recent-empty-icon">↻</span>
          <div><p className="eyebrow">CONNECTOR DISABLED</p><h2>此部署未啟用近期賽事快照</h2><p>免費來源只作實驗整合。先在本機執行連接器、審查資料使用權及快照內容，再透過明確的 Vite 設定載入。GitHub Pages 不會自動擷取第三方資料。</p></div>
        </section>
      )}

      {result.status === 'loading' && <section className="surface recent-empty-state"><span className="recent-empty-icon">…</span><div><h2>正在驗證近期賽事快照</h2><p>檢查 schema、來源聲明與資料完整性。</p></div></section>}

      {(result.status === 'unavailable' || result.status === 'invalid') && (
        <section className="surface recent-empty-state recent-empty-state--error"><span className="recent-empty-icon">!</span><div><p className="eyebrow">SNAPSHOT {result.status.toUpperCase()}</p><h2>無法顯示近期賽事</h2><p>{result.message}</p></div></section>
      )}

      {result.status !== 'ready' && (
        <section className="metric-grid four-up">
          <article className="metric metric--warning"><div className="metric-label"><span>資料來源</span><i /></div><strong>Experimental</strong><p>非官方 hkjc-api 包裝器</p><small>資料使用權仍需審查</small></article>
          <article className="metric"><div className="metric-label"><span>瀏覽器直接連線</span><i /></div><strong>Blocked</strong><p>只接受正規化 JSON 快照</p><small>不暴露供應商端點或憑證</small></article>
          <article className="metric metric--blue"><div className="metric-label"><span>自動公開</span><i /></div><strong>Disabled</strong><p>Pages 工作流不執行連接器</p><small>需人工審閱後匯出</small></article>
          <article className="metric metric--positive"><div className="metric-label"><span>模擬資料混入</span><i /></div><strong>None</strong><p>缺少快照時顯示空白狀態</p><small>不以展示資料代替賽果</small></article>
        </section>
      )}

      {result.status === 'ready' && summary && (
        <>
          {result.snapshot.freshness.status === 'stale' && (
            <section className="surface recent-empty-state recent-empty-state--warning">
              <span className="recent-empty-icon">!</span>
              <div>
                <p className="eyebrow">SNAPSHOT STALE</p>
                <h2>快照已超出新鮮度門檻</h2>
                <p>最新 meeting 日期為 {displayDate(result.snapshot.freshness.latest_meeting_date)}，已超過 {result.snapshot.freshness.max_age_hours} 小時的新鮮度限制。以下內容僅供審閱，不應視為即時賽果。</p>
              </div>
            </section>
          )}
          <section className="recent-provenance surface">
            <div><p className="eyebrow">SOURCE & FRESHNESS</p><h2>{result.snapshot.source.provider}</h2><p>擷取：{displayDate(result.snapshot.source.retrieved_at_utc)} · 新鮮度：{result.snapshot.freshness.status} · 授權：{result.snapshot.source.license_status}</p></div>
            <code>{result.snapshot.source.content_sha256.slice(0, 16)}…</code>
          </section>
          <section className="metric-grid four-up">
            <article className="metric metric--blue"><div className="metric-label"><span>會議</span><i /></div><strong>{summary.meetings}</strong><p>已驗證的 meeting snapshots</p></article>
            <article className="metric metric--positive"><div className="metric-label"><span>賽事</span><i /></div><strong>{summary.races}</strong><p>正規化 races</p></article>
            <article className="metric"><div className="metric-label"><span>馬匹記錄</span><i /></div><strong>{summary.runners}</strong><p>快照 runners</p></article>
            <article className="metric metric--warning"><div className="metric-label"><span>最新日期</span><i /></div><strong>{result.snapshot.freshness.latest_meeting_date ?? '—'}</strong><p>{result.snapshot.freshness.status.toUpperCase()}</p></article>
          </section>
          {result.snapshot.meetings.map((meeting) => <MeetingPanel key={meeting.meeting_id} meeting={meeting} />)}
          {result.snapshot.meetings.length === 0 && <section className="surface recent-empty-state"><span className="recent-empty-icon">○</span><div><h2>來源目前沒有賽事</h2><p>連接器成功執行，但上游在擷取時間沒有返回 meeting。</p></div></section>}
        </>
      )}

      <div className="research-warning"><span>!</span><p><strong>資料權利聲明</strong>連接器程式採用 MIT 套件不代表上游賽事資料可自由再發布。公開或商業使用前必須完成條款、授權及資料供應商審查。</p></div>
    </div>
  )
}
