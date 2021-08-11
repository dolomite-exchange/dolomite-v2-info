import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { Fraction } from '@dolomite-exchange/sdk-core'
import JSBI from 'jsbi'
import { utils } from 'ethers'
import { useMemo } from 'react'
import { ONE_ETH_IN_WEI } from '../constants'

export const INTEREST_INDEX_DATA = () => {
  return gql`
    query allInteretIndinces {
      interestIndexes {
        id
        token {
          id
        }
        borrowIndex
        supplyIndex
        lastUpdate
      }
    }
  `
}

export function useInterestIndexData(pollIntervalMs) {
  const result = useQuery(INTEREST_INDEX_DATA(), {
    pollInterval: pollIntervalMs,
  })

  return useMemo(() => {
    const { loading, error, data } = result

    const anyLoading = Boolean(loading)
    const anyError = Boolean(error)

    if (anyLoading || anyError) {
      return { loading: anyLoading, error: anyError, data: {} }
    }

    const interestIndices = (data?.interestIndexes || []).reduce(
      (memo, index) => {
        const tokenAddress = utils.getAddress(index.token.id)
        memo[tokenAddress] = {
          marketId: JSBI.BigInt(index.id),
          tokenAddress: tokenAddress,
          borrowIndex: new Fraction(index.borrowIndex, ONE_ETH_IN_WEI),
          supplyIndex: new Fraction(index.supplyIndex, ONE_ETH_IN_WEI),
          lastUpdate: new Date(parseInt(index.lastUpdate) * 1000),
        }
        return memo
      },
      {}
    )

    return { loading: false, error: false, data: interestIndices }
  }, [result])
}
