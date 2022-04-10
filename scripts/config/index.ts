import { network } from 'hardhat'
import polygonMainnet from './polygon/mainnet'
import polygonTestnet from './polygon/testnet'

let constants: any = {}

if (network.name === 'polygonMainnet') {
    constants = polygonMainnet
} else if (network.name === 'polygonTestnet') {
    constants = polygonTestnet
}

export default constants
