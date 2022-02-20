import gql from 'graphql-tag'
import { bundleGql } from './queryObjects'
import { BUNDLE_ID } from '../constants'

export const ETH_DATA = (block) => {
  const queryString = block
    ? `
    query bundles {
      bundles(
        where: { id: ${BUNDLE_ID} } 
        block: {number: ${block}}
      ) {
        ${bundleGql()}
      }
    }
  `
    : ` query bundles {
      bundles(
        where: { id: ${BUNDLE_ID} }
      ) {
        ${bundleGql()}
      }
    }
  `
  return gql(queryString)
}

export const PRICES_BY_BLOCK = (tokenAddress, blocks) => {
  let queryString = 'query blocks {'
  queryString += blocks.map(
    (block) => `
      t${block.timestamp}: token(
        id:"${tokenAddress}", 
        block: { number: ${block.number} }
      ) { 
        derivedETH
      }
    `
  )
  queryString += ','
  queryString += blocks.map(
    (block) => `
      b${block.timestamp}: bundle(
        id:"1", block: { number: ${block.number} }
      ) { 
        ${bundleGql()}
      }
    `
  )

  return queryString
}
