import { Fraction } from '@dolomite-exchange/sdk-core'

export default function calculateLeverage(heldAmount, owedAmount, heldPriceUSD, owedPriceUSD) {
  if (!heldPriceUSD || !owedPriceUSD) {
    return new Fraction('0')
  }

  const owedValueUSD = owedAmount.multiply(owedPriceUSD)
  const depositAmountUSD = heldAmount.multiply(heldPriceUSD).subtract(owedValueUSD)
  return owedValueUSD.divide(depositAmountUSD)
}
