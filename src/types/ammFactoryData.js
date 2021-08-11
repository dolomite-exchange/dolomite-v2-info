import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { ammPairDayDataGql } from './queryObjects'

export const AMM_FACTORY_DATA = () => {
  return gql`
    query ammFactory {
      ammFactories(first: 1) {
        ${ammPairDayDataGql(false)}
      }
    }
  `
}


export function useAmmFactoryData(pollIntervalMs) {
  const { loading, error, data } = useQuery(AMM_FACTORY_DATA(), {
    pollInterval: pollIntervalMs,
  })

  const anyLoading = Boolean(loading)
  const anyError = Boolean(error)

  if (anyLoading || anyError) {
    return { loading: anyLoading, error: anyError, data: undefined }
  }

  return { loading: false, error: false, data: data?.ammFactories[0] }
}
