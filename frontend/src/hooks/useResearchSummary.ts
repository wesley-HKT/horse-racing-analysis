import { useEffect, useState } from 'react'
import { DEFAULT_HISTORICAL_METRICS, loadResearchSummary, type ResearchSummaryLoadResult } from '../services/researchSummary'
import type { HistoricalMetrics } from '../types/researchSummary'

type ResearchSummaryState = {
  metrics: HistoricalMetrics
  loadResult: ResearchSummaryLoadResult
}

const initialState: ResearchSummaryState = {
  metrics: DEFAULT_HISTORICAL_METRICS,
  loadResult: { status: 'embedded', metrics: DEFAULT_HISTORICAL_METRICS },
}

export function useResearchSummary() {
  const [state, setState] = useState<ResearchSummaryState>(initialState)

  useEffect(() => {
    const controller = new AbortController()
    loadResearchSummary(controller.signal).then((loadResult) => {
      setState({ metrics: loadResult.metrics, loadResult })
    }).catch((error) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setState({
          metrics: DEFAULT_HISTORICAL_METRICS,
          loadResult: {
            status: 'unavailable',
            metrics: DEFAULT_HISTORICAL_METRICS,
            message: error instanceof Error ? error.message : 'Research summary could not be loaded.',
          },
        })
      }
    })
    return () => controller.abort()
  }, [])

  return state
}
