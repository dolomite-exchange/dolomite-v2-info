import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { parseUnits } from '@ethersproject/units'
import { useMemo } from 'react'
import { ONE_MINUTE } from '../constants'
import { utils } from 'ethers'
import JSBI from 'jsbi'

export const INTEREST_RATE_DATA = gql`
  query allInteretRates {
    interestRates {
      id
      borrowInterestRate
      supplyInterestRate
      token {
        id
      }
    }
  }
`

export function useInterestRateData(pollIntervalMs = ONE_MINUTE) {
  const result = useQuery(INTEREST_RATE_DATA, { pollInterval: pollIntervalMs })

  return useMemo(() => {
    const { loading, error, data } = result
    const anyLoading = Boolean(loading)
    const anyError = Boolean(error)

    if (anyLoading || anyError) {
      return { loading: anyLoading, error: anyError, data: {} }
    }

    const DENOMINATOR = '1000000000000000000'

    const interestRates = (data?.interestRates || []).reduce((memo, gql) => {
      const tokenAddress = utils.getAddress(gql.token.id)
      memo[tokenAddress] = {
        marketId: JSBI.BigInt(gql.id),
        tokenAddress: tokenAddress,
        borrowInterestRate: new Fraction(parseUnits(gql.borrowInterestRate, 18).toString(), DENOMINATOR),
        supplyInterestRate: new Fraction(parseUnits(gql.supplyInterestRate, 18).toString(), DENOMINATOR),
      }
      return memo
    }, {})

    return { loading: false, error: false, data: interestRates }
  }, [result])
}
