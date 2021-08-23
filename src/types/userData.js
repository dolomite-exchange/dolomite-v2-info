import gql from 'graphql-tag'
import { ammLiquidityPositionGql, ammLiquidityPositionSnapshotGql, ammMintGql, ammBurnGql, ammSwapGql } from './queryObjects'

export const USER_HISTORY = () => {
  return  gql`
    query snapshots($user: Bytes!, $skip: Int!) {
      ammLiquidityPositionSnapshots(
        first: 1000, 
        skip: $skip, 
        where: { user: $user }
      ) {
        ${ammLiquidityPositionSnapshotGql()}
      }
    }
  `
}

export const USER_POSITIONS = () => {
  return gql`
    query liquidityPositions($user: Bytes!) {
      ammLiquidityPositions(
        where: { user: $user }
      ) {
        pair {
          ${ammLiquidityPositionGql()}
      }
    }
  `
}

export const USER_TRANSACTIONS = () => {
  return gql`
    query transactions($user: Bytes!) {
      ammMints(
        orderBy: timestamp, 
        orderDirection: desc, where: { to: $user }
        ) {
        ${ammMintGql()}
      }
      ammBurns(
        orderBy: timestamp, 
        orderDirection: desc, where: { sender: $user }
      ) {
        ${ammBurnGql()}
      }
      ammSwaps(
        orderBy: timestamp, 
        orderDirection: desc, 
        where: { to: $user }
      ) {
        ${ammSwapGql()}
      }
    }
  `
}

export const USER_MINTS_BUNRS_PER_PAIR = () => {
  return gql`
    query events($user: Bytes!, $pair: Bytes!) {
      ammMints(where: { to: $user, pair: $pair }) {
        ${ammMintGql()}
      }
      ammBurns(where: { sender: $user, pair: $pair }) {
        ${ammBurnGql()}
      }
    }
  `
}

export const MINING_POSITIONS = (account) => {
  const queryString = `
    query users {
      user(id: "${account}") {
        miningPosition {
          id
          user {
            id
          }
          miningPool {
              pair {
                id
                token0
                token1
              }
          }
          balance
        }
      }
    }
  `
  return gql(queryString)
}