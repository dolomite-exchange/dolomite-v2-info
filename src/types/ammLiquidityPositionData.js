import gql from 'graphql-tag'
import { ammLiquidityPositionGql } from './queryObjects'

export const AMM_LP_PER_PAIR = () => {
  return gql`
    query lps($pair: Bytes!) {
      ammLiquidityPositions(
        where: { pair: $pair }, 
        orderBy: liquidityTokenBalance, 
        orderDirection: desc, first: 10
      ) {
        ${ammLiquidityPositionGql()}
    }
  `
}
