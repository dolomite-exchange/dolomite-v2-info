import gql from 'graphql-tag'
import { tradeGql, ammMintGql, ammBurnGql, ammSwapGql } from './queryObjects'

export const TRADE_DATA = () => {
  return gql`
    query trades {
      trades(
        orderBy: serialId,
        orderDirection: desc,
        first: 100
      ) {
        ${tradeGql()}
      }
    }
  `
}

export const FILTERED_TRANSACTIONS = () => { 
  return gql`
    query($allPairs: [Bytes]!) {
      ammMints(
        first: 20, 
        where: { pair_in: $allPairs }, 
        orderBy: timestamp, 
        orderDirection: desc
      ) {
        ${ammMintGql()}
      }
      ammBurns(
        first: 20, 
        where: { pair_in: $allPairs }, 
        orderBy: timestamp, 
        orderDirection: desc
      ) {
        ${ammBurnGql()}
      }
      ammSwaps(
        first: 30, 
        where: { pair_in: $allPairs }, 
        orderBy: timestamp, 
        orderDirection: desc
      ) {
        ${ammSwapGql()}
      }
    }
  `
}

