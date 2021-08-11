import utils from 'ethers/lib/utils'

export default function toChecksumAddress(address) {
  return address ? utils.getAddress(address) : undefined
}
