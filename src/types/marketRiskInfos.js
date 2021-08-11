import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { parseUnits } from '@ethersproject/units'
import { useMemo } from 'react'
import { ONE_ETH_IN_WEI, ONE_MINUTE } from '../constants'
import { utils } from 'ethers'
import JSBI from 'jsbi'

export const MARKET_RISK_INFOS_DATA = gql`
  query allMarketInfos {
    marketRiskInfos {
      id
      token {
        id
      }
      isBorrowingDisabled
      marginPremium
      liquidationRewardPremium
    }
  }
`

export function useMarketRiskInfos(pollIntervalMs = ONE_MINUTE) {
  const result = useQuery(MARKET_RISK_INFOS_DATA, { pollInterval: pollIntervalMs })

  return useMemo(() => {
    const { loading, error, data } = result
    const anyLoading = Boolean(loading)
    const anyError = Boolean(error)

    if (anyLoading || anyError) {
      return { loading: anyLoading, error: anyError, data: {} }
    }

    const toFraction = (field) => {
      return new Fraction(parseUnits(field, 18).toString(), ONE_ETH_IN_WEI)
    }

    const interestRates = (data?.interestRates || []).reduce(
      (memo, gql) => {
        const tokenAddress = utils.getAddress(gql.token.id)
        memo[tokenAddress] = {
          marketId: JSBI.BigInt(gql.id),
          tokenAddress: tokenAddress,
          isBorrowingDisabled: gql.isBorrowingDisabled,
          marginPremium: toFraction(gql.marginPremium),
          liquidationRewardPremium: toFraction(gql.liquidationRewardPremium),
        }
        return memo
      },
      {}
    )

    return { loading: false, error: false, data: interestRates }
  }, [result])
}
