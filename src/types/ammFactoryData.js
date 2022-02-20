import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { ammFactoryGql } from './queryObjects'
// import { FACTORY_ADDRESS } from '../constants'

export const AMM_FACTORY_DATA = (block) => {
  const queryString = ` query ammFactories {
      ammFactories
       ${block ? `(block: { number: ${block}})` : ``}
      {
        ${ammFactoryGql()}
      }
    }`
  return gql(queryString)
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
