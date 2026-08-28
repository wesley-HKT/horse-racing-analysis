export type SnapshotFreshness = 'current' | 'recent' | 'stale' | 'empty'

export type RecentRaceRunner = {
  runner_id: string
  horse_id: string | null
  horse_code: string | null
  horse_number: number | null
  horse_name_en: string
  horse_name_zh: string
  status: string
  draw: number | null
  jockey_name_en: string
  jockey_name_zh: string
  trainer_name_en: string
  trainer_name_zh: string
  handicap_weight_lb: number | null
  current_rating: number | null
  gear: string | null
  recent_form: string | null
  win_odds: number | null
  finish_position: number | null
  dead_heat: boolean
}

export type RecentRace = {
  race_id: string
  race_number: number | null
  status: string
  race_name_en: string
  race_name_zh: string
  scheduled_time: string | null
  class_code: string | null
  race_class_en: string | null
  race_class_zh: string | null
  distance_m: number | null
  track_en: string | null
  track_zh: string | null
  course_en: string | null
  course_zh: string | null
  course_code: string | null
  going_en: string | null
  going_zh: string | null
  declared_runners: number | null
  runners: RecentRaceRunner[]
}

export type RecentRaceMeeting = {
  meeting_id: string
  meeting_date: string
  venue_code: string
  venue_name_en: string
  venue_name_zh: string
  country_code: string
  status: string
  total_races: number | null
  races: RecentRace[]
}

export type RecentRacesSnapshot = {
  schema_version: '1.0.0'
  generated_at_utc: string
  as_of_utc: string
  data_status: 'snapshot' | 'empty'
  source: {
    provider: string
    connector: string
    connector_version: string
    upstream_package_version: string
    official_api: false
    license_status: 'review-required'
    retrieved_at_utc: string
    content_sha256: string
  }
  freshness: {
    status: SnapshotFreshness
    latest_meeting_date: string | null
    age_hours: number | null
    max_age_hours: number
  }
  meetings: RecentRaceMeeting[]
}
