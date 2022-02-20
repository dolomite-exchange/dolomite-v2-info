import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { getDayID } from './typeHelpers'
import { tokenDayDataGql } from './queryObjects'

export const TOKEN_DAY_DATA_DATA = () => {
  return gql`
      query tokenDayDataForPastMonth {
          tokenDayData(
              orderBy: dayStartUnix,
              orderDirection: desc,
              first: 30
          ) {
              ${tokenDayDataGql()}
          }
      }
  `
}

export function useTokenDayDataData(pollIntervalMs) {
  const { loading, error, data } = useQuery(TOKEN_DAY_DATA_DATA(), {
    pollInterval: pollIntervalMs,
  })

  const anyLoading = Boolean(loading)
  const anyError = Boolean(error)

  if (anyLoading || anyError) {
    return { loading: anyLoading, error: anyError, data: undefined }
  }

  return { loading: false, error: false, data: data?.tokenDayData }
}
