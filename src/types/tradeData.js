import { useQuery } from '@apollo/client'
import { Token, Fraction } from '@dolomite-exchange/v2-sdk'
import gql from 'graphql-tag'
import { createFraction, createTransaction } from './typeHelpers'
import { tradeGql } from './queryObjects'
import { useMemo } from 'react'
import JSBI from 'jsbi'
import { createMarginAccount, createMarginAccountOpt, MarginAccount } from './marginAccount'
import { useAllTokens } from '../hooks/Tokens'
import toChecksumAddress from '../utils/toChecksumAddress'
import { ZERO_ADDRESS } from '../constants'

function getTradesByWallet(walletAddress) {
  return gql`
      query tradesByWallet {
          trades(
              where: { walletsConcatenated_contains: "${walletAddress ?? ZERO_ADDRESS}" },
              orderBy: serialId,
              orderDirection: desc,
              first: 100
          ) {
              ${tradeGql()}
          }
      }
  `
}

export function useTradeData(walletAddress, pollIntervalMs) {
  const gql = useMemo(() => getTradesByWallet(walletAddress), [walletAddress])
  const result = useQuery(gql, { pollInterval: pollIntervalMs })

  const tokenMap = useAllTokens()

  return useMemo(() => {
    const { loading, error, data } = result
    const anyLoading = Boolean(loading)
    const anyError = Boolean(error)

    if (anyLoading || anyError) {
      return { loading: anyLoading, error: anyError, data: [] }
    }

    const trades = (data?.trades || []).map(trade => {
      return {
        transaction: createTransaction(trade.transaction),
        logIndex: JSBI.BigInt(trade.logIndex),
        takerAccount: createMarginAccount(trade.takerAccount),
        makerAccount: createMarginAccountOpt(trade.makerAccount),
        takerToken: tokenMap[toChecksumAddress(trade.takerToken.id) ?? ''],
        makerToken: tokenMap[toChecksumAddress(trade.makerToken.id) ?? ''],
        takerTokenDeltaWei: createFraction(trade.takerTokenDeltaWei),
        makerTokenDeltaWei: createFraction(trade.makerTokenDeltaWei),
        amountUSD: createFraction(trade.amountUSD),
      }
    })

    return { loading: false, error: false, data: trades }
  }, [result, tokenMap])
}
