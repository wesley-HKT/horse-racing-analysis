export const LOCAL_HK_VENUES = new Set(['ST', 'HV'])

export function nullableNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) && number !== 0 ? number : null
}

export function nullablePosition(value) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

export function normalizeRunner(runner) {
  return {
    runner_id: String(runner?.id || runner?.horse?.id || ''),
    horse_id: runner?.horse?.id ? String(runner.horse.id) : null,
    horse_code: runner?.horse?.code ? String(runner.horse.code) : null,
    horse_number: nullableNumber(runner?.no),
    horse_name_en: String(runner?.name_en || ''),
    horse_name_zh: String(runner?.name_ch || ''),
    status: String(runner?.status || 'UNKNOWN'),
    draw: nullableNumber(runner?.barrierDrawNumber),
    jockey_name_en: String(runner?.jockey?.name_en || ''),
    jockey_name_zh: String(runner?.jockey?.name_ch || ''),
    trainer_name_en: String(runner?.trainer?.name_en || ''),
    trainer_name_zh: String(runner?.trainer?.name_ch || ''),
    handicap_weight_lb: nullableNumber(runner?.handicapWeight),
    current_rating: nullableNumber(runner?.currentRating),
    gear: runner?.gearInfo ? String(runner.gearInfo) : null,
    recent_form: runner?.last6run ? String(runner.last6run) : null,
    win_odds: nullableNumber(runner?.winOdds),
    finish_position: nullablePosition(runner?.finalPosition),
    dead_heat: Boolean(runner?.deadHeat),
  }
}

export function normalizeRace(race) {
  return {
    race_id: String(race?.id || ''),
    race_number: nullableNumber(race?.no),
    status: String(race?.status || 'UNKNOWN'),
    race_name_en: String(race?.raceName_en || ''),
    race_name_zh: String(race?.raceName_ch || ''),
    scheduled_time: race?.postTime ? String(race.postTime) : null,
    class_code: race?.claCode ? String(race.claCode) : null,
    race_class_en: race?.raceClass_en ? String(race.raceClass_en) : null,
    race_class_zh: race?.raceClass_ch ? String(race.raceClass_ch) : null,
    distance_m: nullableNumber(race?.distance),
    track_en: race?.raceTrack?.description_en ? String(race.raceTrack.description_en) : null,
    track_zh: race?.raceTrack?.description_ch ? String(race.raceTrack.description_ch) : null,
    course_en: race?.raceCourse?.description_en ? String(race.raceCourse.description_en) : null,
    course_zh: race?.raceCourse?.description_ch ? String(race.raceCourse.description_ch) : null,
    course_code: race?.raceCourse?.displayCode ? String(race.raceCourse.displayCode) : null,
    going_en: race?.go_en ? String(race.go_en) : null,
    going_zh: race?.go_ch ? String(race.go_ch) : null,
    declared_runners: nullableNumber(race?.wageringFieldSize),
    runners: Array.isArray(race?.runners)
      ? race.runners.map(normalizeRunner).sort((left, right) => (left.horse_number ?? 999) - (right.horse_number ?? 999))
      : [],
  }
}

export function venueName(code) {
  const venues = {
    ST: { en: 'Sha Tin', zh: '沙田' },
    HV: { en: 'Happy Valley', zh: '跑馬地' },
  }
  return venues[code] || { en: code || 'Unknown', zh: code || '未知' }
}

export function normalizeMeeting(meeting) {
  const code = String(meeting?.venueCode || '')
  const venue = venueName(code)
  return {
    meeting_id: String(meeting?.id || ''),
    meeting_date: String(meeting?.date || ''),
    venue_code: code,
    venue_name_en: venue.en,
    venue_name_zh: venue.zh,
    country_code: String(meeting?.country?.code || 'HK'),
    status: String(meeting?.status || 'UNKNOWN'),
    total_races: nullableNumber(meeting?.totalNumberOfRace),
    races: Array.isArray(meeting?.races)
      ? meeting.races.map(normalizeRace).sort((left, right) => (left.race_number ?? 999) - (right.race_number ?? 999))
      : [],
  }
}

export function calculateFreshness(meetings, generatedAt) {
  const latestDate = meetings
    .map((meeting) => Date.parse(meeting.meeting_date))
    .filter(Number.isFinite)
    .sort((left, right) => right - left)[0]

  if (!latestDate) return { status: 'empty', latest_meeting_date: null, age_hours: null, max_age_hours: 48 }
  const ageHours = Math.max(0, (Date.parse(generatedAt) - latestDate) / 3_600_000)
  const status = ageHours <= 48 ? 'current' : ageHours <= 336 ? 'recent' : 'stale'
  return {
    status,
    latest_meeting_date: new Date(latestDate).toISOString().slice(0, 10),
    age_hours: Math.round(ageHours * 10) / 10,
    max_age_hours: 48,
  }
}

export function normalizeMeetings(upstreamMeetings) {
  return (Array.isArray(upstreamMeetings) ? upstreamMeetings : [])
    .map(normalizeMeeting)
    .filter((meeting) => meeting.meeting_id && meeting.meeting_date && LOCAL_HK_VENUES.has(meeting.venue_code))
    .sort((left, right) => left.meeting_date.localeCompare(right.meeting_date) || left.venue_code.localeCompare(right.venue_code))
}
