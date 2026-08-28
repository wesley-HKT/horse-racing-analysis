import type { RecentRacesSnapshot } from '../types/recentRaces'

export type RecentRacesLoadResult =
  | { status: 'disabled' }
  | { status: 'ready'; snapshot: RecentRacesSnapshot }
  | { status: 'unavailable' | 'invalid'; message: string }

export const recentRacesEnabled = () => import.meta.env.VITE_ENABLE_RECENT_RACES === 'true'

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object'

function hasValidMeetings(value: unknown) {
  return Array.isArray(value) && value.every((meeting) => {
    if (!isRecord(meeting) || typeof meeting.meeting_id !== 'string' || typeof meeting.meeting_date !== 'string' || !Array.isArray(meeting.races)) return false
    return meeting.races.every((race) => {
      if (!isRecord(race) || typeof race.race_id !== 'string' || !Array.isArray(race.runners)) return false
      return race.runners.every((runner) => isRecord(runner)
        && typeof runner.runner_id === 'string'
        && typeof runner.horse_name_en === 'string'
        && typeof runner.horse_name_zh === 'string')
    })
  })
}

function isSnapshot(value: unknown): value is RecentRacesSnapshot {
  if (!isRecord(value) || !isRecord(value.source) || !isRecord(value.freshness)) return false
  const freshnessStates = new Set(['current', 'recent', 'stale', 'empty'])
  return value.schema_version === '1.0.0'
    && typeof value.generated_at_utc === 'string'
    && typeof value.as_of_utc === 'string'
    && (value.data_status === 'snapshot' || value.data_status === 'empty')
    && typeof value.source.provider === 'string'
    && value.source.official_api === false
    && value.source.license_status === 'review-required'
    && typeof value.source.content_sha256 === 'string'
    && /^[a-f0-9]{64}$/.test(value.source.content_sha256)
    && typeof value.freshness.status === 'string'
    && freshnessStates.has(value.freshness.status)
    && hasValidMeetings(value.meetings)
}

function snapshotUrl() {
  const configured = import.meta.env.VITE_RECENT_RACES_SNAPSHOT_URL?.trim() || 'data/recent-races.snapshot.json'
  if (/^https?:\/\//i.test(configured)) return configured
  const base = new URL(import.meta.env.BASE_URL, window.location.origin)
  return new URL(configured.replace(/^\//, ''), base).toString()
}

export async function loadRecentRaces(signal?: AbortSignal): Promise<RecentRacesLoadResult> {
  if (!recentRacesEnabled()) return { status: 'disabled' }

  try {
    const response = await fetch(snapshotUrl(), {
      cache: 'no-store',
      credentials: 'omit',
      headers: { Accept: 'application/json' },
      signal,
    })
    if (!response.ok) {
      return { status: 'unavailable', message: `Snapshot request returned HTTP ${response.status}.` }
    }
    const payload: unknown = await response.json()
    if (!isSnapshot(payload)) {
      return { status: 'invalid', message: 'Snapshot failed the RacingIQ v1 contract check.' }
    }
    return { status: 'ready', snapshot: payload }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    return { status: 'unavailable', message: error instanceof Error ? error.message : 'Snapshot could not be loaded.' }
  }
}
