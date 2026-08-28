import { createHash } from 'node:crypto'
import { mkdir, rename, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { HorseRacingAPI } = require('hkjc-api')

const CONNECTOR_VERSION = '0.1.0'
const UPSTREAM_PACKAGE_VERSION = '1.0.5'
const SCHEMA_VERSION = '1.0.0'
const LOCAL_HK_VENUES = new Set(['ST', 'HV'])
const toolDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(toolDirectory, '..', '..')
const researchRoot = resolve(repositoryRoot, process.env.HORSE_RACING_RESEARCH_DIR || '.local-research')
const defaultSnapshotPath = resolve(researchRoot, 'recent-races', 'snapshots', 'latest.json')
const frontendSnapshotPath = resolve(repositoryRoot, 'frontend', 'public', 'data', 'recent-races.snapshot.json')

function printHelp() {
  console.log(`RacingIQ experimental recent-race connector

Usage:
  npm run fetch -- --enable-experimental [--output <path>]
  npm run fetch -- --enable-experimental --export-frontend --confirm-publication-reviewed

Safety:
  Network access is refused unless --enable-experimental is present.
  Output defaults to the Git-ignored .local-research directory.
  Frontend export requires an additional publication-review confirmation.
`)
}

function parseArguments(argv) {
  const options = {
    enabled: false,
    exportFrontend: false,
    publicationReviewed: false,
    output: defaultSnapshotPath,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help' || argument === '-h') {
      printHelp()
      process.exit(0)
    }
    if (argument === '--enable-experimental') options.enabled = true
    else if (argument === '--export-frontend') options.exportFrontend = true
    else if (argument === '--confirm-publication-reviewed') options.publicationReviewed = true
    else if (argument === '--output') {
      const value = argv[index + 1]
      if (!value) throw new Error('--output requires a path')
      options.output = isAbsolute(value) ? resolve(value) : resolve(repositoryRoot, value)
      index += 1
    } else if (!argument.startsWith('--')) {
      throw new Error(`Unexpected argument: ${argument}`)
    }
  }

  return options
}

function isWithin(parent, child) {
  const pathFromParent = relative(parent, child)
  return pathFromParent === '' || (!pathFromParent.startsWith('..') && !isAbsolute(pathFromParent))
}

function nullableNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) && number !== 0 ? number : null
}

function nullablePosition(value) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

function normalizeRunner(runner) {
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

function normalizeRace(race) {
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

function venueName(code) {
  const venues = {
    ST: { en: 'Sha Tin', zh: '沙田' },
    HV: { en: 'Happy Valley', zh: '跑馬地' },
  }
  return venues[code] || { en: code || 'Unknown', zh: code || '未知' }
}

function normalizeMeeting(meeting) {
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

function calculateFreshness(meetings, generatedAt) {
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

async function writeJsonAtomically(path, value) {
  await mkdir(dirname(path), { recursive: true })
  const temporaryPath = `${path}.${process.pid}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await rename(temporaryPath, path)
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (!options.enabled) {
    throw new Error('Experimental network access is disabled. Re-run with --enable-experimental after reviewing RECENT_RACES.md.')
  }
  if (!isWithin(researchRoot, options.output)) {
    throw new Error(`Snapshot output must remain under ${researchRoot}`)
  }
  if (options.exportFrontend && !options.publicationReviewed) {
    throw new Error('Frontend export requires --confirm-publication-reviewed.')
  }

  const retrievedAt = new Date().toISOString()
  const api = new HorseRacingAPI()
  const upstreamMeetings = await api.getAllRaces()
  const normalizedMeetings = (Array.isArray(upstreamMeetings) ? upstreamMeetings : [])
    .map(normalizeMeeting)
    .filter((meeting) => meeting.meeting_id && meeting.meeting_date && LOCAL_HK_VENUES.has(meeting.venue_code))
    .sort((left, right) => left.meeting_date.localeCompare(right.meeting_date) || left.venue_code.localeCompare(right.venue_code))
  const rawHash = createHash('sha256').update(JSON.stringify(upstreamMeetings || [])).digest('hex')

  const snapshot = {
    schema_version: SCHEMA_VERSION,
    generated_at_utc: retrievedAt,
    as_of_utc: retrievedAt,
    data_status: normalizedMeetings.length > 0 ? 'snapshot' : 'empty',
    source: {
      provider: 'HKJC GraphQL via hkjc-api',
      connector: 'racingiq-experimental-hkjc',
      connector_version: CONNECTOR_VERSION,
      upstream_package_version: UPSTREAM_PACKAGE_VERSION,
      official_api: false,
      license_status: 'review-required',
      retrieved_at_utc: retrievedAt,
      content_sha256: rawHash,
    },
    freshness: calculateFreshness(normalizedMeetings, retrievedAt),
    meetings: normalizedMeetings,
  }

  await writeJsonAtomically(options.output, snapshot)
  console.log(`Wrote ${normalizedMeetings.length} meeting(s) to ${options.output}`)
  console.log(`Freshness: ${snapshot.freshness.status}; upstream SHA-256: ${rawHash}`)

  if (options.exportFrontend) {
    await writeJsonAtomically(frontendSnapshotPath, snapshot)
    console.log(`Exported reviewed normalized snapshot to ${frontendSnapshotPath}`)
  }
}

main().catch((error) => {
  console.error(`Connector failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
