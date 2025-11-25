// Contract addresses and ABIs
// Load generated addresses from app/src/generated/addresses.json (written by scripts/sync-addresses.js)
// Use ESM import so Vite bundles it for the browser.
import generatedAddresses from '../generated/addresses.json'

export const CONTRACT_ADDRESSES = generatedAddresses || {
  lendingPool: '0x1234567890123456789012345678901234567890',
  mUSDC: '0x1234567890123456789012345678901234567890',
  mBTC: '0x1234567890123456789012345678901234567890',
  oracle: '0x1234567890123456789012345678901234567890',
  aUSDC: '0x1234567890123456789012345678901234567890',
  aBTC: '0x1234567890123456789012345678901234567890',
  debtUSDC: '0x1234567890123456789012345678901234567890',
  debtBTC: '0x1234567890123456789012345678901234567890',
  // Debpol Protocol contracts
  flashLoanProvider: '0x1234567890123456789012345678901234567890',
  debpolToken: '0x1234567890123456789012345678901234567890',
  rewardDistributor: '0x1234567890123456789012345678901234567890',
  oracleAggregator: '0x1234567890123456789012345678901234567890',
}

export function getContractAddresses() {
  return CONTRACT_ADDRESSES
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

// Debpol Protocol Contract ABIs
export const FLASH_LOAN_PROVIDER_ABI = [
  'function flashLoan(address asset, uint256 amount, address receiver, bytes calldata params)',
  'function flashLoanBatch(address[] calldata assets, uint256[] calldata amounts, address receiver, bytes calldata params)',
  'function getFlashLoanFee() view returns (uint256)',
  'function calculateFee(uint256 amount) view returns (uint256)',
  'function getMaxFlashLoan(address asset) view returns (uint256)',
  'function withdrawFees(address asset, uint256 amount)',
  'event FlashLoanExecuted(address indexed receiver, address indexed asset, uint256 amount, uint256 fee)',
]

export const DEBPOL_TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function getVestedAmount(address member) view returns (uint256)',
  'function claimVestedTokens()',
  'function getTeamMemberInfo(address member) view returns (uint256 totalAmount, uint256 claimedAmount, uint256 vestedAmount, uint256 startTime)',
  'function getRemainingCommunityAllocation() view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function getVotes(address account) view returns (uint256)',
  'function delegate(address delegatee)',
  'event TokensVested(address indexed member, uint256 amount)',
  'event TeamMemberAdded(address indexed member, uint256 amount)',
]

export const REWARD_DISTRIBUTOR_ABI = [
  'function updateRewardRate(uint256 newRate)',
  'function setAssetRewardMultiplier(address asset, uint256 multiplier)',
  'function updateUserReward(address user)',
  'function claimRewards() returns (uint256)',
  'function getPendingRewards(address user) view returns (uint256)',
  'function getUserStakedValue(address user) view returns (uint256)',
  'function getAssetRewardMultiplier(address asset) view returns (uint256)',
  'function getRewardRate() view returns (uint256)',
  'function getTotalRewardsDistributed() view returns (uint256)',
  'event RewardsDistributed(address indexed user, uint256 amount)',
  'event RewardsClaimed(address indexed user, uint256 amount)',
]

export const ORACLE_AGGREGATOR_ABI = [
  'function getPrice(address token) view returns (uint256)',
  'function getValue(address token, uint256 amount, uint8 decimals) view returns (uint256)',
  'function updatePrice(address token)',
  'function validatePriceDeviation(address token) view returns (bool)',
  'function getOracleCount(address token) view returns (uint256)',
  'function getOracleData(address token, uint256 index) view returns (address oracle, uint256 weight, bool active)',
  'function isPriceValid(address token) view returns (bool)',
  'function addOracle(address token, address oracle, uint256 weight)',
  'function removeOracle(address token, address oracle)',
  'function setChainlinkFeed(address token, address feed)',
  'event PriceUpdated(address indexed token, uint256 price, uint256 timestamp)',
  'event OracleAdded(address indexed token, address indexed oracle, uint256 weight)',
]



