import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { createPublicClient } from 'viem'

import { cookieStorage, createConfig, createStorage, http } from 'wagmi'
import { mainnet, sepolia, localhost } from 'wagmi/chains'

// Get projectId at https://cloud.walletconnect.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
export const SMASHPROS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
export const MONEYMATCHR = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'

if (!projectId) throw new Error('Project ID is not defined')

const metadata = {
  name: 'Moneymatchr',
  description: 'Moneymatchr app',
  url: 'http://localhost:3000', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Create wagmiConfig
const chains = [mainnet, sepolia, localhost] as const

export const client = createPublicClient({
  chain: localhost,
  transport: http(),
})

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  })
})