import gql from 'graphql-tag'
import { tokenGql, TokenFields, tokenDayDatasGql } from './queryObjects'

export const ALL_TOKEN_DATA = () => {
  return gql`
    query tokens($skip: Int!) {
      tokens(
        first: 500, 
        skip: $skip, 
      ) {
        ${tokenGql()}
      }
    }
  `
}

export const TOKEN_DATA = (tokenAddress, block) => {
  const queryString = `
    ${TokenFields}
    query tokens {
      tokens(
        ${block ? `block : {number: ${block}}` : ``} 
        where: {id:"${tokenAddress}"}
      ) {
        ...TokenFields
      }
      pairs0: ammPairs(
        where: {token0: "${tokenAddress}"}, 
        first: 50, 
        orderBy: reserveUSD, 
        orderDirection: desc
      ) {
        id
      }
      pairs1: ammPairs(
        where: {token1: "${tokenAddress}"}, 
        first: 50, 
        orderBy: reserveUSD, 
        orderDirection: desc
      ) {
        id
      }
    }
  `
  return gql(queryString)
}

export const TOKEN_CHART = () => {
  return gql`
    query tokenDayDatas($tokenAddr: String!, $skip: Int!) {
      tokenDayDatas(
        first: 1000, 
        skip: $skip, 
        orderBy: dayStartUnix, 
        orderDirection: asc, 
        where: { token: $tokenAddr }
      ) {
        ${tokenDayDatasGql()}
      }
    }
  `
}

export const TOKENS_CURRENT = () => {
  return gql`
    ${TokenFields}
    query tokens {
      tokens(first: 200, orderBy: tradeVolumeUSD, orderDirection: desc) {
        ...TokenFields
      }
    }
  `
}

export const TOKENS_DYNAMIC = (block) => {
  const queryString = `
    ${TokenFields}
    query tokens {
        tokens(
        block: {number: ${block}} 
        first: 200, orderBy: 
        tradeVolumeUSD, 
        orderDirection: desc
      ) {
        ...TokenFields
      }
    }
  `
  return gql(queryString)
}

export const TOKEN_SEARCH = () => {
  return gql`
    query tokens($value: String, $id: String) {
      asSymbol: tokens(
        where: { symbol_contains: $value }, 
        orderBy: totalLiquidity, 
        orderDirection: desc
      ) {
        ${tokenGql(false)}
      }
      asName: tokens(
        where: { name_contains: $value }, 
        orderBy: totalLiquidity, 
        orderDirection: desc
      ) {
        ${tokenGql(false)}
      }
      asAddress: tokens(
        where: { id: $id }, 
        orderBy: totalLiquidity, 
        orderDirection: desc
      ) {
        ${tokenGql(false)}
    }
  `
}
