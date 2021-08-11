import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import {
  toCallKey,
} from './actions'
import { useBlockNumber } from '../application/hooks'

// the lowest level call for subscribing to contract data
function useCallsData(calls, options) {
  const { chainId } = useActiveWeb3React()
  const callResults = useSelector(state => state.multicall.callResults)
  const dispatch = useDispatch()

  const serializedCallKeys = useMemo(
    () =>
      JSON.stringify(
        calls
          ?.filter((c) => Boolean(c))
          ?.map(toCallKey)
          ?.sort() ?? []
      ),
    [calls]
  )
}

function isMethodArg(x) {
  if (typeof x === 'object') {
    return Object.values(x).every(isMethodArg)
  }
  return ['string', 'number'].indexOf(typeof x) !== -1
}

function isValidMethodArgs(x) {
  return (
    x === undefined ||
    (Array.isArray(x) && x.every(xi => isMethodArg(xi) || (Array.isArray(xi) && xi.every(isMethodArg))))
  )
}

const INVALID_CALL_STATE = { valid: false, result: undefined, loading: false, syncing: false, error: false }
const LOADING_CALL_STATE = { valid: true, result: undefined, loading: true, syncing: true, error: false }

function toCallState(callResult, contractInterface, fragment, latestBlockNumber) {
  if (!callResult) return INVALID_CALL_STATE
  const { valid, data, blockNumber } = callResult
  if (!valid) return INVALID_CALL_STATE
  if (valid && !blockNumber) return LOADING_CALL_STATE
  if (!contractInterface || !fragment || !latestBlockNumber) return LOADING_CALL_STATE
  const success = data && data.length > 2
  const syncing = (blockNumber ?? 0) < latestBlockNumber
  let result = undefined
  if (success && data) {
    try {
      result = contractInterface.decodeFunctionResult(fragment, data)
    } catch (error) {
      console.debug('Result data parsing failed', fragment, data)
      return {
        valid: true,
        loading: false,
        error: true,
        syncing,
        result,
      }
    }
  }
  return {
    valid: true,
    loading: false,
    syncing,
    result: result,
    error: !success,
  }
}

export function useSingleCallResult(contract, methodName, inputs, options) {
  const fragment = useMemo(() => contract?.interface?.getFunction(methodName), [contract, methodName])

  const calls = useMemo(() => {
    return contract && fragment && isValidMethodArgs(inputs)
      ? [
          {
            address: contract.address,
            callData: contract.interface.encodeFunctionData(fragment, inputs),
          },
        ]
      : []
  }, [contract, fragment, inputs])

  const result = useCallsData(calls, options)[0]
  const latestBlockNumber = useBlockNumber()

  return useMemo(() => {
    return toCallState(result, contract?.interface, fragment, latestBlockNumber)
  }, [result, contract, fragment, latestBlockNumber])
}
