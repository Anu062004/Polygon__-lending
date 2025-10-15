// Contract addresses and ABIs
// In a real implementation, these would be loaded from deployments/amoy.json

export const CONTRACT_ADDRESSES = {
  lendingPool: '0x1234567890123456789012345678901234567890',
  mUSDC: '0x1234567890123456789012345678901234567890',
  mBTC: '0x1234567890123456789012345678901234567890',
  oracle: '0x1234567890123456789012345678901234567890',
  aUSDC: '0x1234567890123456789012345678901234567890',
  aBTC: '0x1234567890123456789012345678901234567890',
  debtUSDC: '0x1234567890123456789012345678901234567890',
  debtBTC: '0x1234567890123456789012345678901234567890',
}

export const TOKENS = {
  mUSDC: {
    symbol: 'mUSDC',
    name: 'Mock USD Coin',
    decimals: 6,
    address: CONTRACT_ADDRESSES.mUSDC,
    icon: '💰',
  },
  mBTC: {
    symbol: 'mBTC',
    name: 'Mock Bitcoin',
    decimals: 8,
    address: CONTRACT_ADDRESSES.mBTC,
    icon: '₿',
  },
}

export function getContractAddresses() {
  return CONTRACT_ADDRESSES
}

export function getTokenInfo(symbol) {
  return TOKENS[symbol]
}

export function getAllTokens() {
  return Object.values(TOKENS)
}

// Mock contract ABIs (simplified)
export const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address, address) view returns (uint256)',
  'function approve(address, uint256) returns (bool)',
  'function transfer(address, uint256) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
]

export const LENDING_POOL_ABI = [
  'function deposit(address asset, uint256 amount)',
  'function withdraw(address asset, uint256 amount)',
  'function borrow(address asset, uint256 amount)',
  'function repay(address asset, uint256 amount)',
  'function liquidate(address collateralAsset, address debtAsset, address borrower, uint256 debtAmount)',
  'function getHealthFactor(address user) view returns (uint256)',
  'function getTotalCollateralValue(address user) view returns (uint256)',
  'function getTotalDebtValue(address user) view returns (uint256)',
  'function getBorrowRate(address asset) view returns (uint256)',
  'function getSupplyRate(address asset) view returns (uint256)',
  'function getUtilizationRate(address asset) view returns (uint256)',
  'function totalSupplied(address) view returns (uint256)',
  'function totalBorrowed(address) view returns (uint256)',
]

export const ORACLE_ABI = [
  'function getPrice(address token) view returns (uint256)',
  'function getValue(address token, uint256 amount, uint8 decimals) view returns (uint256)',
  'function setPrice(address token, uint256 price)',
]

export const ATOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function getUnderlyingAmount(uint256 aTokenAmount) view returns (uint256)',
  'function getATokenAmount(uint256 underlyingAmount) view returns (uint256)',
  'function getInterestIndex() view returns (uint256)',
]

export const DEBT_TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function getUnderlyingDebt(uint256 debtTokenAmount) view returns (uint256)',
  'function getDebtTokenAmount(uint256 underlyingDebt) view returns (uint256)',
  'function getDebtIndex() view returns (uint256)',
]



