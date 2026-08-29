import type { HistoricalMetrics, ResearchSummary } from '../types/researchSummary'

export const DEFAULT_HISTORICAL_METRICS: HistoricalMetrics = {
  records: 273_993,
  races: 22_731,
  topOne: 14.54,
  topThree: 34.85,
  period: '1977-05-07 — 2018-06-27',
  commit: '70b86e9944a0',
  source: 'embedded',
}

export type ResearchSummaryLoadResult =
  | { status: 'embedded'; metrics: HistoricalMetrics }
  | { status: 'ready'; metrics: HistoricalMetrics; summary: ResearchSummary }
  | { status: 'invalid' | 'unavailable'; metrics: HistoricalMetrics; message: string }

export const researchSummaryEnabled = () => import.meta.env.VITE_ENABLE_RESEARCH_SUMMARY === 'true'

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object'

function isSummary(value: unknown): value is ResearchSummary {
  if (!isRecord(value) || !isRecord(value.source) || !isRecord(value.metrics) || !isRecord(value.metrics.period)) return false
  return value.schema_version === '1.0.0'
    && value.data_status === 'verified'
    && typeof value.generated_at_utc === 'string'
    && typeof value.source.provider === 'string'
    && typeof value.source.source_commit === 'string'
    && value.source.official_api === false
    && value.source.license_status === 'review-required'
    && typeof value.metrics.records === 'number'
    && typeof value.metrics.races === 'number'
    && typeof value.metrics.top_one_hit_rate === 'number'
    && typeof value.metrics.top_three_hit_rate === 'number'
    && typeof value.metrics.period.start === 'string'
    && typeof value.metrics.period.end === 'string'
}

function toHistoricalMetrics(summary: ResearchSummary): HistoricalMetrics {
  return {
    records: summary.metrics.records,
    races: summary.metrics.races,
    topOne: Number((summary.metrics.top_one_hit_rate * 100).toFixed(2)),
    topThree: Number((summary.metrics.top_three_hit_rate * 100).toFixed(2)),
    period: `${summary.metrics.period.start} — ${summary.metrics.period.end}`,
    commit: summary.source.source_commit.slice(0, 12),
    source: 'snapshot',
  }
}

function summaryUrl() {
  const configured = import.meta.env.VITE_RESEARCH_SUMMARY_URL?.trim() || 'data/research-summary.json'
  if (/^https?:\/\//i.test(configured)) return configured
  const base = new URL(import.meta.env.BASE_URL, window.location.origin)
  return new URL(configured.replace(/^\//, ''), base).toString()
}

export async function loadResearchSummary(signal?: AbortSignal): Promise<ResearchSummaryLoadResult> {
  if (!researchSummaryEnabled()) {
    return { status: 'embedded', metrics: DEFAULT_HISTORICAL_METRICS }
  }

  try {
    const response = await fetch(summaryUrl(), {
      cache: 'no-store',
      credentials: 'omit',
      headers: { Accept: 'application/json' },
      signal,
    })
    if (!response.ok) {
      return {
        status: 'unavailable',
        metrics: DEFAULT_HISTORICAL_METRICS,
        message: `Research summary request returned HTTP ${response.status}.`,
      }
    }
    const payload: unknown = await response.json()
    if (!isSummary(payload)) {
      return {
        status: 'invalid',
        metrics: DEFAULT_HISTORICAL_METRICS,
        message: 'Research summary failed the RacingIQ v1 contract check.',
      }
    }
    return { status: 'ready', metrics: toHistoricalMetrics(payload), summary: payload }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    return {
      status: 'unavailable',
      metrics: DEFAULT_HISTORICAL_METRICS,
      message: error instanceof Error ? error.message : 'Research summary could not be loaded.',
    }
  }
}
