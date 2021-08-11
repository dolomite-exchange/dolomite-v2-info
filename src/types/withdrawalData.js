import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { withdrawalGql } from './queryObjects'

export const WITHDRAWALS_BY_WALLET_DATA = (walletAddress) => {
  return gql`
      query withdrawalsByWallet {
          withdrawals(
              where: { marginAccount_starts_with: ${walletAddress} }, 
              orderBy: serialId,
              orderDirection: desc,
              first: 100
          ) {
              ${withdrawalGql()}
          }
      }
  `
}

export function useWithdrawalData(walletAddress, pollIntervalMs) {
  const { loading, error, data } = useQuery(WITHDRAWALS_BY_WALLET_DATA(walletAddress), {
    pollInterval: pollIntervalMs,
  })

  const anyLoading = Boolean(loading)
  const anyError = Boolean(error)

  if (anyLoading || anyError) {
    return { loading: anyLoading, error: anyError, data: [] }
  }

  return { loading: false, error: false, data: data?.withdrawals || [] }
}
