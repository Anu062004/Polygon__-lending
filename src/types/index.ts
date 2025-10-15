export interface Token {
  symbol: string
  name: string
  decimals: number
  address: string
  icon: string
}

export interface LendingPool {
  address: string
  name: string
  tokens: Token[]
}

export interface UserPosition {
  supplied: Record<string, number>
  borrowed: Record<string, number>
  healthFactor: number
  netWorth: number
}

export interface MarketData {
  token: string
  supplyApy: number
  borrowApy: number
  totalSupply: number
  totalBorrow: number
  collateralFactor: number
}

export interface Transaction {
  hash: string
  type: 'supply' | 'withdraw' | 'borrow' | 'repay'
  token: string
  amount: number
  timestamp: number
  status: 'pending' | 'success' | 'failed'
}




