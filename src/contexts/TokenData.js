import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'

import { client } from '../apollo/client'
import {
  TOKEN_DATA,
  FILTERED_TRANSACTIONS,
  TOKEN_CHART,
  TOKEN_TOP_DAY_DATAS,
  PRICES_BY_BLOCK,
  PAIR_DATA,
  TOKENS_HISTORICAL_BULK,
} from '../apollo/queries'

import { useEthPrice } from './GlobalData'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

import {
  get2DayPercentChange,
  getPercentChange,
  getBlockFromTimestamp,
  isAddress,
  getBlocksFromTimestamps,
  splitQuery,
} from '../utils'
import { timeframeOptions } from '../constants'
import { useLatestBlocks } from './Application'
import { updateNameData } from '../utils/data'

const UPDATE = 'UPDATE'
const UPDATE_TOKEN_TXNS = 'UPDATE_TOKEN_TXNS'
const UPDATE_CHART_DATA = 'UPDATE_CHART_DATA'
const UPDATE_PRICE_DATA = 'UPDATE_PRICE_DATA'
const UPDATE_TOP_TOKENS = ' UPDATE_TOP_TOKENS'
const UPDATE_ALL_PAIRS = 'UPDATE_ALL_PAIRS'
const UPDATE_COMBINED = 'UPDATE_COMBINED'

const TOKEN_PAIRS_KEY = 'TOKEN_PAIRS_KEY'

dayjs.extend(utc)

const TokenDataContext = createContext()

export function useTokenDataContext() {
  return useContext(TokenDataContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { tokenAddress, data } = payload
      return {
        ...state,
        [tokenAddress]: {
          ...state?.[tokenAddress],
          ...data,
        },
      }
    }
    case UPDATE_TOP_TOKENS: {
      const { topTokens } = payload
      let added = {}
      topTokens &&
        topTokens.map((token) => {
          return (added[token.id] = token)
        })
      return {
        ...state,
        ...added,
      }
    }

    case UPDATE_COMBINED: {
      const { combinedVol } = payload
      return {
        ...state,
        combinedVol,
      }
    }

    case UPDATE_TOKEN_TXNS: {
      const { address, transactions } = payload
      return {
        ...state,
        [address]: {
          ...state?.[address],
          txns: transactions,
        },
      }
    }
    case UPDATE_CHART_DATA: {
      const { address, chartData } = payload
      return {
        ...state,
        [address]: {
          ...state?.[address],
          chartData,
        },
      }
    }

    case UPDATE_PRICE_DATA: {
      const { address, data, timeWindow, interval } = payload
      return {
        ...state,
        [address]: {
          ...state?.[address],
          [timeWindow]: {
            ...state?.[address]?.[timeWindow],
            [interval]: data,
          },
        },
      }
    }

    case UPDATE_ALL_PAIRS: {
      const { address, allPairs } = payload
      return {
        ...state,
        [address]: {
          ...state?.[address],
          [TOKEN_PAIRS_KEY]: allPairs,
        },
      }
    }
    default: {
      throw Error(`Unexpected action type in DataContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, {})
  const update = useCallback((tokenAddress, data) => {
    dispatch({
      type: UPDATE,
      payload: {
        tokenAddress,
        data,
      },
    })
  }, [])

  const updateTopTokens = useCallback((topTokens) => {
    dispatch({
      type: UPDATE_TOP_TOKENS,
      payload: {
        topTokens,
      },
    })
  }, [])

  const updateCombinedVolume = useCallback((combinedVol) => {
    dispatch({
      type: UPDATE_COMBINED,
      payload: {
        combinedVol,
      },
    })
  }, [])

  const updateTokenTxns = useCallback((address, transactions) => {
    dispatch({
      type: UPDATE_TOKEN_TXNS,
      payload: { address, transactions },
    })
  }, [])

  const updateChartData = useCallback((address, chartData) => {
    dispatch({
      type: UPDATE_CHART_DATA,
      payload: { address, chartData },
    })
  }, [])

  const updateAllPairs = useCallback((address, allPairs) => {
    dispatch({
      type: UPDATE_ALL_PAIRS,
      payload: { address, allPairs },
    })
  }, [])

  const updatePriceData = useCallback((address, data, timeWindow, interval) => {
    dispatch({
      type: UPDATE_PRICE_DATA,
      payload: { address, data, timeWindow, interval },
    })
  }, [])

  return (
    <TokenDataContext.Provider
      value={useMemo(
        () => [
          state,
          {
            update,
            updateTokenTxns,
            updateChartData,
            updateTopTokens,
            updateAllPairs,
            updatePriceData,
            updateCombinedVolume,
          },
        ],
        [
          state,
          update,
          updateTokenTxns,
          updateCombinedVolume,
          updateChartData,
          updateTopTokens,
          updateAllPairs,
          updatePriceData,
        ]
      )}
    >
      {children}
    </TokenDataContext.Provider>
  )
}

const getTopTokens = async (ethPrice, ethPriceOld) => {
  const utcCurrentTime = dayjs()
  const utcOneDayBack = utcCurrentTime.subtract(1, 'day').unix()
  const utcTwoDaysBack = utcCurrentTime.subtract(2, 'day').unix()
  let oneDayBlock = await getBlockFromTimestamp(utcOneDayBack)
  let twoDayBlock = await getBlockFromTimestamp(utcTwoDaysBack)

  try {
    // need to get the top tokens by liquidity by need token day datas
    const currentDate = parseInt(Date.now() / 86400 / 1000) * 86400 - 86400

    let tokenids = await client.query({
      query: TOKEN_TOP_DAY_DATAS,
      fetchPolicy: 'network-only',
      variables: { date: currentDate },
    })

    const ids = tokenids?.data?.tokenDayDatas?.reduce((accum, entry) => {
      accum.push(entry.id.slice(0, 42))
      return accum
    }, [])

    let current = await client.query({
      query: TOKENS_HISTORICAL_BULK(ids),
      fetchPolicy: 'cache-first',
    })

    let oneDayResult = await client.query({
      query: TOKENS_HISTORICAL_BULK(ids, oneDayBlock),
      fetchPolicy: 'cache-first',
    })

    let twoDayResult = await client.query({
      query: TOKENS_HISTORICAL_BULK(ids, twoDayBlock),
      fetchPolicy: 'cache-first',
    })

    let oneDayData = oneDayResult?.data?.tokens.reduce((obj, cur, i) => {
      return { ...obj, [cur.id]: cur }
    }, {})

    let twoDayData = twoDayResult?.data?.tokens.reduce((obj, cur, i) => {
      return { ...obj, [cur.id]: cur }
    }, {})

    let bulkResults = await Promise.all(
      current &&
        oneDayData &&
        twoDayData &&
        current?.data?.tokens.map(async (token) => {
          let data = token

          // let liquidityDataThisToken = liquidityData?.[token.id]
          let oneDayHistory = oneDayData?.[token.id]
          let twoDayHistory = twoDayData?.[token.id]

          // catch the case where token wasnt in top list in previous days
          if (!oneDayHistory) {
            let oneDayResult = await client.query({
              query: TOKEN_DATA(token.id, oneDayBlock),
              fetchPolicy: 'cache-first',
            })
            oneDayHistory = oneDayResult.data.tokens[0]
          }
          if (!twoDayHistory) {
            let twoDayResult = await client.query({
              query: TOKEN_DATA(token.id, twoDayBlock),
              fetchPolicy: 'cache-first',
            })
            twoDayHistory = twoDayResult.data.tokens[0]
          }

          // calculate percentage changes and daily changes
          const [oneDayVolumeUSD, volumeChangeUSD] = get2DayPercentChange(
            data.tradeVolumeUSD,
            oneDayHistory?.tradeVolumeUSD ?? 0,
            twoDayHistory?.tradeVolumeUSD ?? 0
          )
          const [oneDayTxns, txnChange] = get2DayPercentChange(
            data.txCount,
            oneDayHistory?.txCount ?? 0,
            twoDayHistory?.txCount ?? 0
          )

          const currentLiquidityUSD = data?.totalLiquidity * ethPrice * data?.derivedETH
          const oldLiquidityUSD = oneDayHistory?.totalLiquidity * ethPriceOld * oneDayHistory?.derivedETH

          // percent changes
          const priceChangeUSD = getPercentChange(
            data?.derivedETH * ethPrice,
            oneDayHistory?.derivedETH ? oneDayHistory?.derivedETH * ethPriceOld : 0
          )

          // set data
          data.priceUSD = data?.derivedETH * ethPrice
          data.totalLiquidityUSD = currentLiquidityUSD
          data.oneDayVolumeUSD = parseFloat(oneDayVolumeUSD)
          data.volumeChangeUSD = volumeChangeUSD
          data.priceChangeUSD = priceChangeUSD
          data.liquidityChangeUSD = getPercentChange(currentLiquidityUSD ?? 0, oldLiquidityUSD ?? 0)
          data.oneDayTxns = oneDayTxns
          data.txnChange = txnChange

          // new tokens
          if (!oneDayHistory && data) {
            data.oneDayVolumeUSD = data.tradeVolumeUSD
            data.oneDayVolumeETH = data.tradeVolume * data.derivedETH
            data.oneDayTxns = data.txCount
          }

          // update name data for
          updateNameData({
            token0: data,
          })

          // HOTFIX for Aave
          if (data.id === '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9') {
            const aaveData = await client.query({
              query: PAIR_DATA('0xdfc14d2af169b0d36c4eff567ada9b2e0cae044f'),
              fetchPolicy: 'cache-first',
            })
            const result = aaveData.data.pairs[0]
            data.totalLiquidityUSD = parseFloat(result.reserveUSD) / 2
            data.liquidityChangeUSD = 0
            data.priceChangeUSD = 0
          }

          // used for custom adjustments
          data.oneDayData = oneDayHistory
          data.twoDayData = twoDayHistory

          return data
        })
    )

    return bulkResults

    // calculate percentage changes and daily changes
  } catch (e) {
    console.log(e)
  }
}

const getTokenData = async (address, ethPrice, ethPriceOld) => {
  const utcCurrentTime = dayjs()
  const utcOneDayBack = utcCurrentTime.subtract(1, 'day').startOf('minute').unix()
  const utcTwoDaysBack = utcCurrentTime.subtract(2, 'day').startOf('minute').unix()
  let oneDayBlock = await getBlockFromTimestamp(utcOneDayBack)
  let twoDayBlock = await getBlockFromTimestamp(utcTwoDaysBack)

  // initialize data arrays
  let data = {}
  let oneDayData = {}
  let twoDayData = {}

  try {
    // fetch all current and historical data
    let result = await client.query({
      query: TOKEN_DATA(address),
      fetchPolicy: 'cache-first',
    })
    data = result?.data?.tokens?.[0]

    // get results from 24 hours in past
    let oneDayResult = await client.query({
      query: TOKEN_DATA(address, oneDayBlock),
      fetchPolicy: 'cache-first',
    })
    oneDayData = oneDayResult.data.tokens[0]

    // get results from 48 hours in past
    let twoDayResult = await client.query({
      query: TOKEN_DATA(address, twoDayBlock),
      fetchPolicy: 'cache-first',
    })
    twoDayData = twoDayResult.data.tokens[0]

    // catch the case where token wasnt in top list in previous days
    if (!oneDayData) {
      let oneDayResult = await client.query({
        query: TOKEN_DATA(address, oneDayBlock),
        fetchPolicy: 'cache-first',
      })
      oneDayData = oneDayResult.data.tokens[0]
    }
    if (!twoDayData) {
      let twoDayResult = await client.query({
        query: TOKEN_DATA(address, twoDayBlock),
        fetchPolicy: 'cache-first',
      })
      twoDayData = twoDayResult.data.tokens[0]
    }

    // calculate percentage changes and daily changes
    const [oneDayVolumeUSD, volumeChangeUSD] = get2DayPercentChange(
      data.tradeVolumeUSD,
      oneDayData?.tradeVolumeUSD ?? 0,
      twoDayData?.tradeVolumeUSD ?? 0
    )

    // calculate percentage changes and daily changes
    const [oneDayVolumeUT, volumeChangeUT] = get2DayPercentChange(
      data.untrackedVolumeUSD,
      oneDayData?.untrackedVolumeUSD ?? 0,
      twoDayData?.untrackedVolumeUSD ?? 0
    )

    // calculate percentage changes and daily changes
    const [oneDayTxns, txnChange] = get2DayPercentChange(
      data.txCount,
      oneDayData?.txCount ?? 0,
      twoDayData?.txCount ?? 0
    )

    const priceChangeUSD = getPercentChange(
      data?.derivedETH * ethPrice,
      parseFloat(oneDayData?.derivedETH ?? 0) * ethPriceOld
    )

    const currentLiquidityUSD = data?.totalLiquidity * ethPrice * data?.derivedETH
    const oldLiquidityUSD = oneDayData?.totalLiquidity * ethPriceOld * oneDayData?.derivedETH

    // set data
    data.priceUSD = data?.derivedETH * ethPrice
    data.totalLiquidityUSD = currentLiquidityUSD
    data.oneDayVolumeUSD = oneDayVolumeUSD
    data.volumeChangeUSD = volumeChangeUSD
    data.priceChangeUSD = priceChangeUSD
    data.oneDayVolumeUT = oneDayVolumeUT
    data.volumeChangeUT = volumeChangeUT
    const liquidityChangeUSD = getPercentChange(currentLiquidityUSD ?? 0, oldLiquidityUSD ?? 0)
    data.liquidityChangeUSD = liquidityChangeUSD
    data.oneDayTxns = oneDayTxns
    data.txnChange = txnChange

    // used for custom adjustments
    data.oneDayData = oneDayData?.[address]
    data.twoDayData = twoDayData?.[address]

    // new tokens
    if (!oneDayData && data) {
      data.oneDayVolumeUSD = data.tradeVolumeUSD
      data.oneDayVolumeETH = data.tradeVolume * data.derivedETH
      data.oneDayTxns = data.txCount
    }

    // update name data for
    updateNameData({
      token0: data,
    })

    // HOTFIX for Aave
    if (data.id === '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9') {
      const aaveData = await client.query({
        query: PAIR_DATA('0xdfc14d2af169b0d36c4eff567ada9b2e0cae044f'),
        fetchPolicy: 'cache-first',
      })
      const result = aaveData.data.pairs[0]
      data.totalLiquidityUSD = parseFloat(result.reserveUSD) / 2
      data.liquidityChangeUSD = 0
      data.priceChangeUSD = 0
    }
  } catch (e) {
    console.log(e)
  }
  return data
}

const getTokenTransactions = async (allPairsFormatted) => {
  const transactions = {}
  try {
    let result = await client.query({
      query: FILTERED_TRANSACTIONS,
      variables: {
        allPairs: allPairsFormatted,
      },
      fetchPolicy: 'cache-first',
    })
    transactions.mints = result.data.mints
    transactions.burns = result.data.burns
    transactions.swaps = result.data.swaps
  } catch (e) {
    console.log(e)
  }
  return transactions
}

const getTokenPairs = async (tokenAddress) => {
  try {
    // fetch all current and historical data
    let result = await client.query({
      query: TOKEN_DATA(tokenAddress),
      fetchPolicy: 'cache-first',
    })
    return result.data?.['pairs0'].concat(result.data?.['pairs1'])
  } catch (e) {
    console.log(e)
  }
}

const getIntervalTokenData = async (tokenAddress, startTime, interval = 3600, latestBlock) => {
  const utcEndTime = dayjs.utc()
  let time = startTime

  // create an array of hour start times until we reach current hour
  // buffer by half hour to catch case where graph isnt synced to latest block
  const timestamps = []
  while (time < utcEndTime.unix()) {
    timestamps.push(time)
    time += interval
  }

  // backout if invalid timestamp format
  if (timestamps.length === 0) {
    return []
  }

  // once you have all the timestamps, get the blocks for each timestamp in a bulk query
  let blocks
  try {
    blocks = await getBlocksFromTimestamps(timestamps, 100)

    // catch failing case
    if (!blocks || blocks.length === 0) {
      return []
    }

    if (latestBlock) {
      blocks = blocks.filter((b) => {
        return parseFloat(b.number) <= parseFloat(latestBlock)
      })
    }

    let result = await splitQuery(PRICES_BY_BLOCK, client, [tokenAddress], blocks, 50)

    // format token ETH price results
    let values = []
    for (var row in result) {
      let timestamp = row.split('t')[1]
      let derivedETH = parseFloat(result[row]?.derivedETH)
      if (timestamp) {
        values.push({
          timestamp,
          derivedETH,
        })
      }
    }

    // go through eth usd prices and assign to original values array
    let index = 0
    for (var brow in result) {
      let timestamp = brow.split('b')[1]
      if (timestamp) {
        values[index].priceUSD = result[brow].ethPrice * values[index].derivedETH
        index += 1
      }
    }

    let formattedHistory = []

    // for each hour, construct the open and close price
    for (let i = 0; i < values.length - 1; i++) {
      formattedHistory.push({
        timestamp: values[i].timestamp,
        open: parseFloat(values[i].priceUSD),
        close: parseFloat(values[i + 1].priceUSD),
      })
    }

    return formattedHistory
  } catch (e) {
    console.log(e)
    console.log('error fetching blocks')
    return []
  }
}

const getTokenChartData = async (tokenAddress) => {
  let data = []
  const utcEndTime = dayjs.utc()
  let utcStartTime = utcEndTime.subtract(1, 'year')
  let startTime = utcStartTime.startOf('minute').unix() - 1

  try {
    let allFound = false
    let skip = 0
    while (!allFound) {
      let result = await client.query({
        query: TOKEN_CHART,
        variables: {
          tokenAddr: tokenAddress,
          skip,
        },
        fetchPolicy: 'cache-first',
      })
      if (result.data.tokenDayDatas.length < 1000) {
        allFound = true
      }
      skip += 1000
      data = data.concat(result.data.tokenDayDatas)
    }

    let dayIndexSet = new Set()
    let dayIndexArray = []
    const oneDay = 24 * 60 * 60
    data.forEach((dayData, i) => {
      dayData.date = data[i].dayStartUnix
      dayData.dailyVolumeUSD = parseFloat(dayData.dailyAmmSwapVolumeUSD)
      dayData.priceUSD = dayData.ammPriceUSD
      dayData.totalLiquidityUSD = dayData.ammLiquidityUSD
      // add the day index to the set of days
      dayIndexSet.add((data[i].date / oneDay).toFixed(0))
      dayIndexArray.push(data[i])
    })

    // fill in empty days
    let timestamp = data[0] && data[0].date ? data[0].date : startTime
    let latestLiquidityUSD = data[0] && data[0].totalLiquidityUSD
    let latestPriceUSD = data[0] && data[0].priceUSD
    let latestPairDatas = data[0] && data[0].mostLiquidPairs
    let index = 1
    while (timestamp < utcEndTime.startOf('minute').unix() - oneDay) {
      const nextDay = timestamp + oneDay
      let currentDayIndex = (nextDay / oneDay).toFixed(0)
      if (!dayIndexSet.has(currentDayIndex)) {
        data.push({
          date: nextDay,
          dayString: nextDay,
          dailyVolumeUSD: 0,
          priceUSD: latestPriceUSD,
          totalLiquidityUSD: latestLiquidityUSD,
          mostLiquidPairs: latestPairDatas,
        })
      } else {
        latestLiquidityUSD = dayIndexArray[index].totalLiquidityUSD
        latestPriceUSD = dayIndexArray[index].priceUSD
        latestPairDatas = dayIndexArray[index].mostLiquidPairs
        index = index + 1
      }
      timestamp = nextDay
    }
    data = data.sort((a, b) => (parseInt(a.date) > parseInt(b.date) ? 1 : -1))
  } catch (e) {
    console.log(e)
  }
  return data
}

export function Updater() {
  const [, { updateTopTokens }] = useTokenDataContext()
  const [ethPrice, ethPriceOld] = useEthPrice()
  useEffect(() => {
    async function getData() {
      // get top pairs for overview list
      let topTokens = await getTopTokens(ethPrice, ethPriceOld)
      topTokens && updateTopTokens(topTokens)
    }
    ethPrice && ethPriceOld && getData()
  }, [ethPrice, ethPriceOld, updateTopTokens])
  return null
}

export function useTokenData(tokenAddress) {
  const [state, { update }] = useTokenDataContext()
  const [ethPrice, ethPriceOld] = useEthPrice()
  const tokenData = state?.[tokenAddress]

  useEffect(() => {
    if (!tokenData && ethPrice && ethPriceOld && isAddress(tokenAddress)) {
      getTokenData(tokenAddress, ethPrice, ethPriceOld).then((data) => {
        update(tokenAddress, data)
      })
    }
  }, [ethPrice, ethPriceOld, tokenAddress, tokenData, update])

  return tokenData || {}
}

export function useTokenTransactions(tokenAddress) {
  const [state, { updateTokenTxns }] = useTokenDataContext()
  const tokenTxns = state?.[tokenAddress]?.txns

  const allPairsFormatted =
    state[tokenAddress] &&
    state[tokenAddress].TOKEN_PAIRS_KEY &&
    state[tokenAddress].TOKEN_PAIRS_KEY.map((pair) => {
      return pair.id
    })

  useEffect(() => {
    async function checkForTxns() {
      if (!tokenTxns && allPairsFormatted) {
        let transactions = await getTokenTransactions(allPairsFormatted)
        updateTokenTxns(tokenAddress, transactions)
      }
    }
    checkForTxns()
  }, [tokenTxns, tokenAddress, updateTokenTxns, allPairsFormatted])

  return tokenTxns || []
}

export function useTokenPairs(tokenAddress) {
  const [state, { updateAllPairs }] = useTokenDataContext()
  const tokenPairs = state?.[tokenAddress]?.[TOKEN_PAIRS_KEY]

  useEffect(() => {
    async function fetchData() {
      let allPairs = await getTokenPairs(tokenAddress)
      updateAllPairs(tokenAddress, allPairs)
    }
    if (!tokenPairs && isAddress(tokenAddress)) {
      fetchData()
    }
  }, [tokenAddress, tokenPairs, updateAllPairs])

  return tokenPairs || []
}

export function useTokenDataCombined(tokenAddresses) {
  const [state, { updateCombinedVolume }] = useTokenDataContext()
  const [ethPrice, ethPriceOld] = useEthPrice()

  const volume = state?.combinedVol

  useEffect(() => {
    async function fetchDatas() {
      Promise.all(
        tokenAddresses.map(async (address) => {
          return await getTokenData(address, ethPrice, ethPriceOld)
        })
      )
        .then((res) => {
          if (res) {
            const newVolume = res
              ? res?.reduce(function (acc, entry) {
                  acc = acc + parseFloat(entry.oneDayVolumeUSD)
                  return acc
                }, 0)
              : 0
            updateCombinedVolume(newVolume)
          }
        })
        .catch(() => {
          console.log('error fetching combined data')
        })
    }
    if (!volume && ethPrice && ethPriceOld) {
      fetchDatas()
    }
  }, [tokenAddresses, ethPrice, ethPriceOld, volume, updateCombinedVolume])

  return volume
}

export function useTokenChartDataCombined(tokenAddresses) {
  const [state, { updateChartData }] = useTokenDataContext()

  const datas = useMemo(() => {
    return (
      tokenAddresses &&
      tokenAddresses.reduce(function (acc, address) {
        acc[address] = state?.[address]?.chartData
        return acc
      }, {})
    )
  }, [state, tokenAddresses])

  const isMissingData = useMemo(() => Object.values(datas).filter((val) => !val).length > 0, [datas])

  const formattedByDate = useMemo(() => {
    return (
      datas &&
      !isMissingData &&
      Object.keys(datas).map(function (address) {
        const dayDatas = datas[address]
        return dayDatas?.reduce(function (acc, dayData) {
          acc[dayData.date] = dayData
          return acc
        }, {})
      }, {})
    )
  }, [datas, isMissingData])

  useEffect(() => {
    async function fetchDatas() {
      Promise.all(
        tokenAddresses.map(async (address) => {
          return await getTokenChartData(address)
        })
      )
        .then((res) => {
          res &&
            res.map((result, i) => {
              const tokenAddress = tokenAddresses[i]
              updateChartData(tokenAddress, result)
              return true
            })
        })
        .catch(() => {
          console.log('error fetching combined data')
        })
    }
    if (isMissingData) {
      fetchDatas()
    }
  }, [isMissingData, tokenAddresses, updateChartData])

  return formattedByDate
}

export function useTokenChartData(tokenAddress) {
  const [state, { updateChartData }] = useTokenDataContext()
  const chartData = state?.[tokenAddress]?.chartData
  useEffect(() => {
    async function checkForChartData() {
      if (!chartData) {
        let data = await getTokenChartData(tokenAddress)
        updateChartData(tokenAddress, data)
      }
    }
    checkForChartData()
  }, [chartData, tokenAddress, updateChartData])
  return chartData
}

/**
 * get candlestick data for a token - saves in context based on the window and the
 * interval size
 * @param {*} tokenAddress
 * @param {*} timeWindow // a preset time window from constant - how far back to look
 * @param {*} interval  // the chunk size in seconds - default is 1 hour of 3600s
 */
export function useTokenPriceData(tokenAddress, timeWindow, interval = 3600) {
  const [state, { updatePriceData }] = useTokenDataContext()
  const chartData = state?.[tokenAddress]?.[timeWindow]?.[interval]
  const [latestBlock] = useLatestBlocks()

  useEffect(() => {
    const currentTime = dayjs.utc()
    const windowSize = timeWindow === timeframeOptions.MONTH ? 'month' : 'week'
    const startTime =
      timeWindow === timeframeOptions.ALL_TIME ? 1589760000 : currentTime.subtract(1, windowSize).startOf('hour').unix()

    async function fetch() {
      let data = await getIntervalTokenData(tokenAddress, startTime, interval, latestBlock)
      updatePriceData(tokenAddress, data, timeWindow, interval)
    }
    if (!chartData) {
      fetch()
    }
  }, [chartData, interval, timeWindow, tokenAddress, updatePriceData, latestBlock])

  return chartData
}

export function useAllTokenData() {
  const [state] = useTokenDataContext()

  // filter out for only addresses
  return Object.keys(state)
    .filter((key) => key !== 'combinedVol')
    .reduce((res, key) => {
      res[key] = state[key]
      return res
    }, {})
}
