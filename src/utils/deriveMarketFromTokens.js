import { Token } from '@dolomite-exchange/v2-sdk'

function decipherWithOrdering(token0, token1) {
  if (token0.symbol === 'USDC') {
    return `${token1.symbol}-${token0.symbol}`
  }
  if (token0.symbol === 'DAI') {
    return `${token1.symbol}-${token0.symbol}`
  }
  if (token0.symbol?.includes('BTC')) {
    return `${token1.symbol}-${token0.symbol}`
  }
  if (token0.symbol?.includes('ETH')) {
    return `${token1.symbol}-${token0.symbol}`
  }

  return undefined
}

export default function deriveMarketFromTokens(token0, token1) {
  if (!token0 || !token1) {
    return undefined
  }

  let market = decipherWithOrdering(token0, token1)
  if (!market) {
    market = decipherWithOrdering(token1, token0)
  }
  if (!market) {
    market = `${token0.symbol}-${token1.symbol}`
  }

  return market
}
