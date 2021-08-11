import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { transferGql } from './queryObjects'

export const TRANSFERS_BY_WALLET_DATA = (walletAddress) => {
  return gql`
      query transfersByWallet {
          transfers(
              where: { walletsConcatenated_contains: ${walletAddress}, isSelfTransfer: false },
              orderBy: serialId,
              orderDirection: desc,
              first: 100
          ) {
              ${transferGql()}
          }
      }
  `
}

export function useTransferData(walletAddress, pollIntervalMs) {
  const { loading, error, data } = useQuery(TRANSFERS_BY_WALLET_DATA(walletAddress), {
    pollInterval: pollIntervalMs,
  })

  const anyLoading = Boolean(loading)
  const anyError = Boolean(error)

  if (anyLoading || anyError) {
    return { loading: anyLoading, error: anyError, data: [] }
  }

  return { loading: false, error: false, data: data?.transfers || [] }
}
