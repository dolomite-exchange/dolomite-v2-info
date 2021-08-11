import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { ammPairHourData } from './queryObjects'
import { ONE_ETH_IN_WEI, ONE_MINUTE, ZERO_ADDRESS } from '../constants'
import useCurrentBlockTimestamp from '../hooks/useCurrentBlockTimestamp'
import { useMemo } from 'react'
import { Fraction } from '@dolomite-exchange/sdk-core'
import JSBI from 'jsbi'
import { parseUnits } from '@ethersproject/units'
import { Pair } from '@dolomite-exchange/v2-sdk'

export const last24HourPairData = (pairAddress, currentTimestamp, yesterdayTimestamp) => {
  return gql`
      query last24HoursOfAmmPairData {
          ammPairHourDatas(where: {pairAddress: "${pairAddress.toLowerCase()}", hourStartUnix_lt: ${currentTimestamp}, hourStartUnix_gte: ${yesterdayTimestamp}}) {
              ${ammPairHourData()}
          }
      }
  `
}

export function useLast24HourPairData(pair) {
  const timestamp = useCurrentBlockTimestamp()
  const currentTimestamp = timestamp ? Math.floor(timestamp.toNumber() / 3600) : 0
  const lastTimestamp = timestamp ? Math.floor(timestamp.toNumber() / 3600 - 24) : 0
  const { loading, error, data } = useQuery(
    last24HourPairData(pair ? pair.liquidityToken.address : ZERO_ADDRESS, currentTimestamp, lastTimestamp),
    { pollInterval: ONE_MINUTE }
  )

  return useMemo(() => {
    const anyLoading = Boolean(loading)
    const anyError = Boolean(error)

    if (anyLoading || anyError) {
      return { loading: anyLoading, error: anyError, data: [] }
    }

    const pairHourData = (data?.ammPairHourDatas || []).map(value => {
      return {
        hourStartUnix: value.hourStartUnix,
        pairAddress: value.pairAddress,
        token0: value.token0,
        token1: value.token1,
        reserve0: new Fraction(parseUnits(value.reserve0, 18).toString(), ONE_ETH_IN_WEI),
        reserve1: new Fraction(parseUnits(value.reserve1, 18).toString(), ONE_ETH_IN_WEI),
        reserveUSD: new Fraction(parseUnits(value.reserveUSD, 18).toString(), ONE_ETH_IN_WEI),
        hourlyVolumeToken0: new Fraction(parseUnits(value.hourlyVolumeToken0, 18).toString(), ONE_ETH_IN_WEI),
        hourlyVolumeToken1: new Fraction(parseUnits(value.hourlyVolumeToken1, 18).toString(), ONE_ETH_IN_WEI),
        hourlyVolumeUSD: new Fraction(parseUnits(value.hourlyVolumeUSD, 18).toString(), ONE_ETH_IN_WEI),
        hourlyTransactionCount: JSBI.BigInt(value.hourlyTransactionCount),
      }
    })

    return { loading: false, error: false, data: pairHourData }
  }, [loading, error, data])
}
