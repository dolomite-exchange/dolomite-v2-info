import gql from 'graphql-tag'
import { ammPairDataGql, ammPairDayDataGql, ammPairPriceGql, ammPairGql } from './queryObjects'

export const ALL_PAIR_DATA = () => {
  return gql `
    query ammPairs($skip: Int!) {
      ammPairs(
        first: 500, 
        skip: $skip, 
        orderBy: trackedReserveETH, 
        orderDirection: desc
      ) {
        ${ammPairDataGql()}
      }
    }
  `
}

export const PAIR_DATA = (pairAddress, block) => {
  const queryString = `
    query ammPairs {
      ammPairs(
        ${block ? `block: {number: ${block}},` : ``} 
        where: { id: "${pairAddress}"} 
      ) {
        ${ammPairDataGql()}
      }
    }`
  return gql(queryString)
}

export const PAIR_CHART = () => {
  return gql`
    query ammPairDayDatas($pairAddress: Bytes!, $skip: Int!) {
      ammPairDayDatas(
        first: 1000, 
        skip: $skip, 
        orderBy: date, 
        orderDirection: asc, 
        where: { pairAddress: $pairAddress }
      ) {
        ${ammPairDayDataGql(false)}
      }
    }
  `
}

export const PAIRS_BULK  = () => {
  return gql`
    query ammPairs($allPairs: [Bytes]!) {
      ammPairs(
        first: 500, 
        where: { id_in: $allPairs }, 
        orderBy: trackedReserveETH, 
        orderDirection: desc
      ) {
        ${ammPairDataGql()}
      }  
    }
  `
}

export const PAIRS_CURRENT = () => {
  return gql`
    query ammPairs {
      ammPairs(
        first: 200, 
        orderBy: reserveUSD, 
        orderDirection: desc
      ) {
        ${ammPairDataGql()}
      }
    }
  `
}

export const PAIRS_HISTORICAL_BULK = (block, pairs) => {
  let pairsString = `[`
  pairs.map((pair) => {
    return (pairsString += `"${pair}"`)
  })
  pairsString += ']'
  let queryString = `
  query ammPairs {
    ammPairs(
      first: 200, 
      where: {id_in: ${pairsString}}, 
      block: {number: ${block}}, 
      orderBy: trackedReserveETH, 
      orderDirection: desc
    ) {
      ${ammPairGql(false)}
    }
  }
  `
  return gql(queryString)
}

export const PAIR_DAY_DATA_BULK = (pairs, startTimestamp) => {
  let pairsString = `[`
  pairs.map((pair) => {
    return (pairsString += `"${pair}"`)
  })
  pairsString += ']'
  const queryString = `
    query days {
      ammPairDayDatas(
        first: 1000, 
        orderBy: date, 
        orderDirection: asc, 
        where: { pairAddress_in: ${pairsString}, 
        date_gt: ${startTimestamp} }
      ) {
        ${ammPairDayDataGql()}
      }
    } 
`
  return gql(queryString)
}

export const HOURLY_PAIR_RATES = (pairAddress, blocks) => {
  let queryString = 'query blocks {'
  queryString += blocks.map(
    (block) => `
      t${block.timestamp}: ammPair(
        id:"${pairAddress}", 
        block: { number: ${block.number} }
      ) { 
        ${ammPairPriceGql()}
      }
    `
  )

  queryString += '}'
  return gql(queryString)
}

export const PAIR_SEARCH = () => {
  return gql`
    query pairs($tokens: [Bytes]!, $id: String) {
      as0: ammPairs(where: { token0_in: $tokens }) {
        ${ammPairDataGql()}
      }
      as1: ammPairs(where: { token1_in: $tokens }) {
        ${ammPairDataGql()}
      }
      asAddress: ammPairs(where: { id: $id }) {
        ${ammPairDataGql()}
      }
    }
  `
}

