export type ResearchSummary = {
  schema_version: '1.0.0'
  generated_at_utc: string
  data_status: 'verified' | 'empty'
  source: {
    provider: string
    source_commit: string
    official_api: false
    license_status: 'review-required'
  }
  metrics: {
    records: number
    races: number
    top_one_hit_rate: number
    top_three_hit_rate: number
    period: {
      start: string
      end: string
    }
  }
  baseline: string
  limitations: string[]
}

export type HistoricalMetrics = {
  records: number
  races: number
  topOne: number
  topThree: number
  period: string
  commit: string
  source: 'embedded' | 'snapshot'
}
