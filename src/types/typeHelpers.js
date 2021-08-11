import { CurrencyAmount, Fraction } from '@dolomite-exchange/sdk-core'
import { parseUnits } from '@ethersproject/units'
import JSBI from 'jsbi'

const units = 18
export const getDayID = (date) => Math.floor(date.getTime() / 86400000).toString()
const DENOMINATOR = '1000000000000000000'
export const createDateOpt = (dateString) => {
  return dateString ? createDate(dateString) : undefined
}
export const createDate = (dateString) => {
  return new Date(parseInt(dateString) * 1000)
}
export const createFractionOpt = (field) => {
  return field ? createFraction(field) : undefined
}
export const createFraction = (field) => {
  return new Fraction(parseUnits(field, units).toString(), DENOMINATOR)
}
export const createCurrencyAmountOpt = (token, field) => {
  return field ? CurrencyAmount.fromRawAmount(token, parseUnits(field, token.decimals).toString()) : undefined
}
export const createCurrencyAmount = (token, field) => {
  return CurrencyAmount.fromRawAmount(token, parseUnits(field, token.decimals).toString())
}
export const createTransaction = (transaction) => {
  return {
    transactionHash: transaction.id,
    blockNumber: JSBI.BigInt(transaction.blockNumber),
    timestamp: new Date(parseInt(transaction.timestamp) * 1000),
  }
}
