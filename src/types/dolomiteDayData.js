import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { dolomiteDayDataGql } from './queryObjects'

export const DOLOMITE_DAY_DATA_DATA = () => {
  return gql`
    query dolomiteDayDataForPastMonth {
      dolomiteDayData(
          orderBy: dayStartUnix,
          orderDirection: desc,
          first: 30
      ) {
          ${dolomiteDayDataGql()}
      }
    }
  `
}

export function useDolomiteDayDataData(pollIntervalMs) {
  const { loading, error, data } = useQuery(DOLOMITE_DAY_DATA_DATA(), {
    pollInterval: pollIntervalMs,
  })

  const anyLoading = Boolean(loading)
  const anyError = Boolean(error)

  if (anyLoading || anyError) {
    return { loading: anyLoading, error: anyError, data: undefined }
  }

  return { loading: false, error: false, data: data?.dolomiteDayData }
}
