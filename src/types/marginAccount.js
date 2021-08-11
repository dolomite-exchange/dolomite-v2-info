import JSBI from 'jsbi'

export function createMarginAccount(marginAccount) {
  return {
    account: marginAccount.user.id,
    accountNumber: JSBI.BigInt(marginAccount.accountNumber),
    lastUpdatedTimestamp: createDate(marginAccount.lastUpdatedTimestamp),
    lastUpdatedBlockNumber: JSBI.BigInt(marginAccount.lastUpdatedBlockNumber),
  }
}
export function createMarginAccountOpt(marginAccount) {
  return marginAccount ? createMarginAccount(marginAccount) : undefined
}
