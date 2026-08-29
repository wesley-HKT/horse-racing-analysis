import { createHash } from 'node:crypto'
import { mkdir, rename, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { calculateFreshness, normalizeMeetings } from './normalize.mjs'

const require = createRequire(import.meta.url)
const { HorseRacingAPI } = require('hkjc-api')

const CONNECTOR_VERSION = '0.1.0'
const UPSTREAM_PACKAGE_VERSION = '1.0.5'
const SCHEMA_VERSION = '1.0.0'
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
  const normalizedMeetings = normalizeMeetings(upstreamMeetings)
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
