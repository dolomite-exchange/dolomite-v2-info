import gql from 'graphql-tag'
import { ammMintGql, ammBurnGql, ammSwapGql } from './queryObjects'

export const TRANSACTION_DATA = () => {
  return gql`
    query transactions {
      transactions(first: 100, orderBy: timestamp, orderDirection: desc) {
        ammMints(orderBy: timestamp, orderDirection: desc) {
          ${ammMintGql()}
        }
        ammBurns(orderBy: timestamp, orderDirection: desc) {
          ${ammBurnGql()}
        }
        ammSwaps(orderBy: timestamp, orderDirection: desc) {
          ${ammSwapGql()}
        }
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
