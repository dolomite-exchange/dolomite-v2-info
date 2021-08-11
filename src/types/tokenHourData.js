import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { createCurrencyAmount, createFraction } from './typeHelpers'
import { tokenHourDataGql } from './queryObjects'
import { useMemo } from 'react'
import JSBI from 'jsbi'
import { ZERO_ADDRESS } from '../constants'
import { parseUnits } from '@ethersproject/units'

function getTokenHourDataGql(token) {
  return gql`
      query tokenHourDataForPastDay {
          tokenHourDatas(
              orderBy: hourStartUnix,
              orderDirection: desc,
              first: 24,
              where: { token: "${token?.address.toLowerCase() ?? ZERO_ADDRESS}" }
          ) {
              ${tokenHourDataGql()}
          }
      }
  `
}

export function useTokenHourDataData(token, pollIntervalMs) {
  const query = useMemo(() => getTokenHourDataGql(token), [token])
  const result = useQuery(query, { pollInterval: pollIntervalMs })

  return useMemo(() => {
    const { loading, error, data } = result
    const anyLoading = Boolean(loading)
    const anyError = Boolean(error)

    if (anyLoading || anyError || !token) {
      return { loading: anyLoading, error: anyError, data: undefined }
    }

    const tokenHourDatas = data?.tokenHourDatas?.map(data => {
      return {
        hourStartUnix: new Date(data.hourStartUnix * 3600 * 1000),
        hourlyAmmSwapVolumeUSD: createFraction(data.hourlyAmmSwapVolumeUSD),
        hourlyBorrowVolumeUSD: createFraction(data.hourlyBorrowVolumeUSD),
        hourlyLiquidationVolumeUSD: createFraction(data.hourlyLiquidationVolumeUSD),
        hourlyTradeVolumeUSD: createFraction(data.hourlyTradeVolumeUSD),
        hourlyVaporizationVolumeUSD: createFraction(data.hourlyVaporizationVolumeUSD),
        hourlyAmmSwapVolumeToken: createCurrencyAmount(token, data.hourlyAmmSwapVolumeToken),
        hourlyBorrowVolumeToken: createCurrencyAmount(token, data.hourlyBorrowVolumeToken),
        hourlyLiquidationVolumeToken: createCurrencyAmount(token, data.hourlyLiquidationVolumeToken),
        hourlyTradeVolumeToken: createCurrencyAmount(token, data.hourlyTradeVolumeToken),
        hourlyVaporizationVolumeToken: createCurrencyAmount(token, data.hourlyVaporizationVolumeToken),
        ammLiquidityUSD: createFraction(data.ammLiquidityUSD),
        borrowLiquidityUSD: createFraction(data.borrowLiquidityUSD),
        supplyLiquidityUSD: createFraction(data.supplyLiquidityUSD),
        ammLiquidityToken: createCurrencyAmount(token, data.ammLiquidityToken),
        borrowLiquidityToken: createCurrencyAmount(token, data.borrowLiquidityToken),
        supplyLiquidityToken: createCurrencyAmount(token, data.supplyLiquidityToken),
        hourlyAllTransactionCount: JSBI.BigInt(data.hourlyAllTransactionCount),
        hourlyAmmSwapCount: JSBI.BigInt(data.hourlyAmmSwapCount),
        hourlyLiquidationCount: JSBI.BigInt(data.hourlyLiquidationCount),
        hourlyTradeCount: JSBI.BigInt(data.hourlyTradeCount),
        hourlyVaporizationCount: JSBI.BigInt(data.hourlyVaporizationCount),
        ammPriceUSD: createFraction(data.ammPriceUSD),
        openPriceUSD: createFraction(data.openPriceUSD),
        highPriceUSD: createFraction(data.highPriceUSD),
        lowPriceUSD: createFraction(data.lowPriceUSD),
        closePriceUSD: createFraction(data.closePriceUSD),
      }
    })

    return { loading: false, error: false, data: tokenHourDatas }
  }, [result, token])
}
