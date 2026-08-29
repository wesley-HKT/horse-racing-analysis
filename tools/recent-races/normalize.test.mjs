import assert from 'node:assert/strict'
import test from 'node:test'

import {
  calculateFreshness,
  normalizeMeeting,
  normalizeMeetings,
  normalizeRunner,
} from './normalize.mjs'

test('normalizeRunner maps upstream fields and sorts null positions', () => {
  const runner = normalizeRunner({
    id: 'runner-1',
    no: 4,
    name_en: 'Lucky Star',
    name_ch: '幸運星',
    status: 'Declared',
    barrierDrawNumber: 2,
    jockey: { name_en: 'Z. Purton', name_ch: '潘頓' },
    trainer: { name_en: 'J. Size', name_ch: '蔡約翰' },
    currentRating: 88,
    last6run: '1/2/3',
    winOdds: 5.5,
    finalPosition: 1,
  })

  assert.equal(runner.runner_id, 'runner-1')
  assert.equal(runner.horse_number, 4)
  assert.equal(runner.horse_name_zh, '幸運星')
  assert.equal(runner.finish_position, 1)
  assert.equal(normalizeRunner({ finalPosition: 0 }).finish_position, null)
})

test('normalizeMeeting keeps local HK venues and sorts races', () => {
  const meeting = normalizeMeeting({
    id: 'meeting-1',
    date: '2026-08-24',
    venueCode: 'ST',
    status: 'RESULT',
    totalNumberOfRace: 2,
    races: [
      { id: 'race-2', no: 2, raceName_en: 'Race 2', raceName_ch: '第二場', status: 'RESULT', runners: [] },
      { id: 'race-1', no: 1, raceName_en: 'Race 1', raceName_ch: '第一場', status: 'RESULT', runners: [] },
    ],
  })

  assert.equal(meeting.venue_name_zh, '沙田')
  assert.deepEqual(meeting.races.map((race) => race.race_number), [1, 2])
})

test('normalizeMeetings excludes overseas simulcast venues', () => {
  const meetings = normalizeMeetings([
    { id: 'hk', date: '2026-08-24', venueCode: 'ST', races: [] },
    { id: 'overseas', date: '2026-08-24', venueCode: 'S1', races: [] },
  ])

  assert.equal(meetings.length, 1)
  assert.equal(meetings[0].venue_code, 'ST')
})

test('calculateFreshness marks stale meetings beyond the freshness window', () => {
  const generatedAt = '2026-08-29T00:00:00.000Z'
  const freshness = calculateFreshness(
    [{ meeting_date: '2026-08-01' }],
    generatedAt,
  )

  assert.equal(freshness.status, 'stale')
  assert.equal(freshness.latest_meeting_date, '2026-08-01')
  assert.ok((freshness.age_hours ?? 0) > 48)
})
