export const tokenDayDataGql = () => {
  return `
  id
  dayStartUnix
  dailyAmmSwapVolumeUSD
  dailyBorrowVolumeUSD
  dailyLiquidationVolumeUSD
  dailyTradeVolumeUSD
  dailyVaporizationVolumeUSD
  dailyAmmSwapVolumeToken
  dailyBorrowVolumeToken
  dailyLiquidationVolumeToken
  dailyTradeVolumeToken
  dailyVaporizationVolumeToken
  ammLiquidityUSD
  borrowLiquidityUSD
  supplyLiquidityUSD
  ammLiquidityToken
  borrowLiquidityToken
  supplyLiquidityToken
  dailyAllTransactionCount
  dailyAmmSwapCount
  dailyLiquidationCount
  dailyTradeCount
  dailyVaporizationCount
  ammPriceUSD
  openPriceUSD
  highPriceUSD
  lowPriceUSD
  closePriceUSD
  `
}

export const tokenHourDataGql = () => {
  return `
  id
  hourStartUnix
  
  hourlyAmmSwapVolumeUSD
  hourlyBorrowVolumeUSD
  hourlyLiquidationVolumeUSD
  hourlyTradeVolumeUSD
  hourlyVaporizationVolumeUSD
  
  hourlyAmmSwapVolumeToken
  hourlyBorrowVolumeToken
  hourlyLiquidationVolumeToken
  hourlyTradeVolumeToken
  hourlyVaporizationVolumeToken
  
  ammLiquidityUSD
  borrowLiquidityUSD
  supplyLiquidityUSD
  
  ammLiquidityToken
  borrowLiquidityToken
  supplyLiquidityToken
  
  hourlyAllTransactionCount
  hourlyAmmSwapCount
  hourlyLiquidationCount
  hourlyTradeCount
  hourlyVaporizationCount
  
  ammPriceUSD
  openPriceUSD
  highPriceUSD
  lowPriceUSD
  closePriceUSD
  `
}

export const dolomiteDayDataGql = () => {
  return `
    id
    dayStartUnix
    dailyAmmSwapVolumeUSD
    dailyBorrowVolumeUSD
    dailyLiquidationVolumeUSD
    dailySupplyVolumeUSD
    dailyTradeVolumeUSD
    dailyVaporizationVolumeUSD
    dailyAmmSwapVolumeUntracked
    ammLiquidityUSD
    borrowLiquidityUSD
    supplyLiquidityUSD
    totalAllTransactionCount
    totalAmmSwapCount
    totalLiquidationCount
    totalTradeCount
    totalVaporizationCount
  `
}

export const tokenGql = (includeExtraValues, onlyIncludeId = false) => {
  if (onlyIncludeId) {
    return 'id'
  }

  let extraData
  if (!includeExtraValues) {
    extraData = ''
  } else {
    extraData = `
    totalSupply
    tradeVolume
    tradeVolumeUSD
    untrackedVolumeUSD
    transactionCount
    ammSwapLiquidity
    supplyLiquidity
    borrowLiquidity
    supplyLiquidityUSD
    borrowLiquidityUSD
    derivedETH
    tokenDayData {
      ${tokenDayDataGql()}
    }
    pairDayDataBase {
      ${ammPairDayDataGql(false)}
    }
    pairDayDataQuote {
      ${ammPairDayDataGql(false)}
    }
    pairBase {
      ${ammPairGql(false)}
    }
    pairQuote {
      ${ammPairGql(false)}
    }
  `
  }

  return `
    id
    symbol
    name
    decimals
    marketId
    ${extraData}
  `
}

export const ammPairGql = (includeTokenData) => {
  let tokenData
  if (includeTokenData) {
    tokenData = tokenGql(false)
  } else {
    tokenData = 'id'
  }

  return `
    id
    token0 { ${tokenData} }
    token1 { ${tokenData} }
    reserve0
    reserve1
    totalSupply
    reserveETH
    reserveUSD
    trackedReserveETH
    token0Price
    token1Price
    volumeToken0
    volumeToken1
    volumeUSD
    untrackedVolumeUSD
    transactionCount
    createdAtTimestamp
    createdAtBlockNumber
    liquidityProviderCount
  `
}

export const ammPairDayDataGql = (includeTokenData) => {
  let tokenData
  if (includeTokenData) {
    tokenData = tokenGql(false)
  } else {
    tokenData = 'id'
  }

  return `
  id
  dayStartUnix
  pairAddress
  token0 { ${tokenData} }
  token1 { ${tokenData} }
  reserve0
  reserve1
  totalSupply
  reserveUSD
  dailyVolumeToken0
  dailyVolumeToken1
  dailyVolumeUSD
  dailyTransactions
  `
}

export const transactionGql = () => {
  return `
    id
    blockNumber
    timestamp
  `
}

export const ammLiquidityPositionGql = () => {
  return `
    id
    liquidityTokenBalance
    pair {
      ${ammPairGql(false)}
    }
  `
}

export const ammPairHourData = () => {
  return `
    id
    hourStartUnix
    pairAddress
    token0 {
      ${tokenGql(false)}
    }
    token1 {
      ${tokenGql(false)}
    }
    reserve0
    reserve1
    reserveUSD
    hourlyVolumeToken0
    hourlyVolumeToken1
    hourlyVolumeUSD
    hourlyTransactionCount
  `
}

export const userGql = (includeExtraData) => {
  let extraData
  if (!includeExtraData) {
    extraData = ''
  } else {
    extraData = `
    liquidityPositions {
      ${ammLiquidityPositionGql()}
    }
    marginAccounts: [MarginAccount!]
  `
  }

  return `
    id
    totalUsdBorrowed
    totalUsdLiquidated
    totalUsdSwapped
    totalUsdTraded
    ${extraData}
  `
}

export const marginAccountGql = (includeTokenValues) => {
  let tokenValues
  if (!includeTokenValues) {
    tokenValues = ''
  } else {
    tokenValues = `
    tokenValues {
      id
      marketId
      token {
        ${tokenGql(false)}
      }
      valuePar
      expirationTimestamp
    }
  `
  }

  return `
    id
    user {
      id
    }
    accountNumber
    lastUpdatedTimestamp
    lastUpdatedBlockNumber
    ${tokenValues}
  `
}

export const depositGql = () => {
  return `
    id
    transaction {
      ${transactionGql()}
    }
    logIndex
    serialId
    marginAccount {
      ${marginAccountGql(false)}
    }
    token {
      ${tokenGql(false)}
    }
    from
    amountDeltaWei
    amountUSDDeltaWei
  `
}

export const withdrawalGql = () => {
  return `
    id
    transaction {
      ${transactionGql()}
    }
    logIndex
    serialId
    marginAccount {
      ${marginAccountGql(false)}
    }
    token {
      ${tokenGql(false)}
    }
    to
    amountDeltaWei
    amountUSDDeltaWei
  `
}

export const transferGql = () => {
  return `
    id
    transaction {
      ${transactionGql()}
    }
    logIndex
    serialId
    fromMarginAccount {
      ${marginAccountGql(false)}
    }
    toMarginAccount {
      ${marginAccountGql(false)}
    }
    token {
      ${tokenGql(false)}
    }
    amountDeltaWei
    amountUSDDeltaWei
  `
}

export const tradeGql = () => {
  return `
    id
    transaction {
      ${transactionGql()}
    }
    logIndex
    serialId
    takerMarginAccount {
      ${marginAccountGql(false)}
    }
    makerMarginAccount {
      ${marginAccountGql(false)}
    }
    takerToken {
      ${tokenGql(false)}
    }
    makerToken {
      ${tokenGql(false)}
    }
    takerTokenDeltaWei
    makerTokenDeltaWei
    amountUSDDeltaWei
  `
}

export const liquidationGql = () => {
  return `
    id
    transaction {
      ${transactionGql()}
    }
    logIndex
    serialId
    solidMarginAccount {
      ${marginAccountGql(false)}
    }
    liquidMarginAccount {
      ${marginAccountGql(false)}
    }
    heldToken {
      ${tokenGql(false)}
    }
    borrowedToken {
      ${tokenGql(false)}
    }
    heldTokenAmountDeltaWei
    heldTokenLiquidationRewardWei
    borrowedTokenAmountDeltaWei
    debtUSDLiquidated
    collateralUSDLiquidated
    collateralUSDLiquidationReward
  `
}

export const vaporizationGql = () => {
  return `
    id
    transaction {
      ${transactionGql()}
    }
    logIndex
    serialId
    solidMarginAccount {
      ${marginAccountGql(false)}
    }
    vaporMarginAccount {
      ${marginAccountGql(false)}
    }
    heldToken {
      ${tokenGql(false)}
    }
    borrowedToken {
      ${tokenGql(false)}
    }
    heldTokenAmountDeltaWei
    borrowedTokenAmountDeltaWei
    amountUSDLiquidated
  `
}

export const marginPositionGql = () => {
  return `
    id
    marginAccount {
      ${marginAccountGql(false)}
    }
    openTimestamp
    heldToken {
      ${tokenGql(false)}
    }
    marginDeposit
    marginDepositUSD
    initialHeldAmountPar
    initialHeldAmountWei
    initialHeldAmountUSD
    initialHeldPriceUSD
    closeHeldPriceUSD
    closeHeldAmountWei
    closeHeldAmountUSD
    heldAmount
    owedToken {
      ${tokenGql(false)}
    }
    initialOwedAmountPar
    initialOwedAmountWei
    initialOwedAmountUSD
    initialOwedPriceUSD
    closeOwedPriceUSD
    closeOwedAmountWei
    closeOwedAmountUSD
    owedAmount
    status
    closeTimestamp
    expirationTimestamp
  `
}
