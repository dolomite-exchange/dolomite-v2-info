import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'

export const SOLO_MARGIN_DATA = () => {
  return gql`
    query soloMargin {
      dyDxSoloMargins(first: 1) {
        id
        supplyLiquidityUSD
        borrowLiquidityUSD
        totalBorrowVolumeUSD
        totalLiquidationVolumeUSD
        totalSupplyVolumeUSD
        totalTradeVolumeUSD
        totalVaporizationVolumeUSD
        actionCount
        liquidationCount
        tradeCount
        transactionCount
        vaporizationCount
      }
    }
  `
}

export function useSoloMarginData(pollIntervalMs) {
  const { loading, error, data } = useQuery(SOLO_MARGIN_DATA(), {
    pollInterval: pollIntervalMs,
  })

  const anyLoading = Boolean(loading)
  const anyError = Boolean(error)

  if (anyLoading || anyError) {
    return { loading: anyLoading, error: anyError, data: undefined }
  }

  return { loading: false, error: false, data: data?.dyDxSoloMargins[0] }
}
