// import { polygonAmoy } from 'wagmi/chains' // Temporarily commented out

export const config = {
  // chains: [polygonAmoy], // Temporarily commented out
  chainId: 80002, // Polygon Amoy testnet chain ID
  rpcUrl: 'https://rpc-amoy.polygon.technology',
  contracts: {
    // Mock lending contract addresses for Amoy testnet
    lendingPool: '0x1234567890123456789012345678901234567890',
    dai: '0x1234567890123456789012345678901234567890',
    usdc: '0x1234567890123456789012345678901234567890',
    weth: '0x1234567890123456789012345678901234567890',
  },
  tokens: {
    DAI: {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      address: '0x1234567890123456789012345678901234567890',
      icon: '💰',
    },
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: '0x1234567890123456789012345678901234567890',
      icon: '💵',
    },
    WETH: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      address: '0x1234567890123456789012345678901234567890',
      icon: '⚡',
    },
  },
} as const



