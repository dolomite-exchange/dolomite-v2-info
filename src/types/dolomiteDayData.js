import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { dolomiteDayDataGql, dolomiteGlobalDataGql } from './queryObjects'

export const DOLOMITE_DAY_DATA_DATA = (days) => {
  return gql`
    query dolomiteDayDataForPastMonth {
      dolomiteDayData(
          orderBy: dayStartUnix,
          orderDirection: desc,
          first: ${days}
      ) {
          ${dolomiteDayDataGql()}
      }
    }
  `
}

export const DOLOMITE_GLOBAL_DATA = () => {
  return gql`
    query dolomiteDatas($startTime: Int!, $skip: Int!) {
      dolomiteDayDatas(
        first: 1000, 
        skip: $skip, 
        where: { dayStartUnix_gt: $startTime }, 
        orderBy: dayStartUnix, 
        orderDirection: asc
      ) {
        ${dolomiteGlobalDataGql()}
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
