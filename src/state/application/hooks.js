import { useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'

export function useBlockNumber() {
  const { chainId } = useActiveWeb3React()

  return useSelector((state) => state.application.blockNumber[chainId ?? -1])
}
