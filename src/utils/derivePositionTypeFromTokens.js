import { PositionType } from '../types/marginPositionData'
import { Token } from '@dolomite-exchange/v2-sdk'

export default function derivePositionTypeFromTokens(heldToken, owedToken) {
  if (!owedToken || !heldToken) {
    return PositionType.UNKNOWN
  }

  if (owedToken.symbol === 'USDC') {
    return PositionType.LONG
  } else if (owedToken.symbol === 'DAI') {
    if (heldToken.symbol === 'USDC') {
      return PositionType.SHORT
    } else {
      return PositionType.LONG
    }
  } else if (heldToken.symbol === 'USDC') {
    return PositionType.SHORT
  } else if (heldToken.symbol === 'DAI') {
    return PositionType.SHORT
  } else {
    return PositionType.CROSS
  }
}

