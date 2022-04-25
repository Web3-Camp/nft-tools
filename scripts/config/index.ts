import { network } from 'hardhat'
import polygonMainnet from './polygon/mainnet'
import polygonTestnet from './polygon/testnet'
import hardhat from './hardhat/testnet'

let constants: any = {}

if (network.name === 'polygonMainnet') {
    constants = polygonMainnet
} else if (network.name === 'polygonTestnet') {
    constants = polygonTestnet
} else if (network.name === 'hardhat') {
    constants = hardhat
}

export default constants
