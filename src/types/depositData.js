import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { depositGql } from './queryObjects'

export const DEPOSITS_BY_WALLET_DATA = (walletAddress) => {
  return gql`
      query depositsByWallet {
          deposits(
              where: { marginAccount_starts_with: ${walletAddress} }, 
              orderBy: serialId,
              orderDirection: desc,
              first: 50
          ) {
              ${depositGql()}
          }
      }
  `
}

export function useDepositData(walletAddress, pollIntervalMs) {
  const { loading, error, data } = useQuery(DEPOSITS_BY_WALLET_DATA(walletAddress), {
    pollInterval: pollIntervalMs,
  })

  const anyLoading = Boolean(loading)
  const anyError = Boolean(error)

  if (anyLoading || anyError) {
    return { loading: anyLoading, error: anyError, data: [] }
  }

  return { loading: false, error: false, data: data?.deposits || [] }
}
