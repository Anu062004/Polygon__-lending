import React, { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther } from 'viem'
import { toast } from 'react-hot-toast'
import { Gift, Coins, TrendingUp, Zap } from 'lucide-react'
import { CONTRACT_ADDRESSES, REWARD_DISTRIBUTOR_ABI, ERC20_ABI, getAllTokens } from '../utils/contracts'

export function RewardsSection() {
  const { address, isConnected } = useAccount()
  const [refreshKey, setRefreshKey] = useState(0)

  const tokens = getAllTokens()

  // Get pending rewards
  const { data: pendingRewards, refetch: refetchRewards } = useReadContract({
    address: CONTRACT_ADDRESSES.rewardDistributor,
    abi: REWARD_DISTRIBUTOR_ABI,
    functionName: 'getPendingRewards',
    args: [address],
    enabled: isConnected && !!address,
  })

  // Get staked value
  const { data: stakedValue } = useReadContract({
    address: CONTRACT_ADDRESSES.rewardDistributor,
    abi: REWARD_DISTRIBUTOR_ABI,
    functionName: 'getUserStakedValue',
    args: [address],
    enabled: isConnected && !!address,
  })

  // Get reward rate
  const { data: rewardRate } = useReadContract({
    address: CONTRACT_ADDRESSES.rewardDistributor,
    abi: REWARD_DISTRIBUTOR_ABI,
    functionName: 'getRewardRate',
    enabled: isConnected,
  })

  // Get total rewards distributed
  const { data: totalDistributed } = useReadContract({
    address: CONTRACT_ADDRESSES.rewardDistributor,
    abi: REWARD_DISTRIBUTOR_ABI,
    functionName: 'getTotalRewardsDistributed',
    enabled: isConnected,
  })

  // Get asset multipliers
  const [assetMultipliers, setAssetMultipliers] = useState({})
  
  useEffect(() => {
    if (isConnected && tokens.length > 0) {
      // Fetch multipliers for each token
      // This would need to be done with individual contract calls
      // For now, showing placeholder
      const multipliers = {}
      tokens.forEach(token => {
        multipliers[token.symbol] = '1.0x'
      })
      setAssetMultipliers(multipliers)
    }
  }, [isConnected, tokens, refreshKey])

  const { writeContract, data: claimHash, isPending: isClaiming } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  })

  const handleClaimRewards = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.rewardDistributor,
        abi: REWARD_DISTRIBUTOR_ABI,
        functionName: 'claimRewards',
      })
    } catch (error) {
      console.error('Claim rewards error:', error)
      toast.error(error.message || 'Claim failed')
    }
  }

  const handleUpdateRewards = async () => {
    if (!isConnected || !address) return
    
    try {
      // This would update user rewards before claiming
      // For now, we'll just refetch
      await refetchRewards()
      setRefreshKey(k => k + 1)
      toast.success('Rewards updated')
    } catch (error) {
      console.error('Update rewards error:', error)
    }
  }

  useEffect(() => {
    if (isClaimSuccess) {
      toast.success('Rewards claimed successfully!')
      refetchRewards()
    }
  }, [isClaimSuccess, refetchRewards])

  const hasRewards = pendingRewards && pendingRewards > 0n
  const rewardsAmount = pendingRewards ? formatEther(pendingRewards) : '0'

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <Gift className="w-6 h-6 text-green-400" />
        <h3 className="text-xl font-bold text-white">Rewards</h3>
      </div>

      <div className="space-y-6">
        {/* Reward Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-green-400" />
              <span className="text-sm text-white/70">Pending Rewards</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {rewardsAmount}
            </p>
            <p className="text-xs text-white/60 mt-1">DEBPOL</p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-white/70">Staked Value</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stakedValue ? formatEther(stakedValue) : '0'}
            </p>
            <p className="text-xs text-white/60 mt-1">USD</p>
          </div>
        </div>

        {/* Reward Info */}
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-300/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-300" />
            <span className="text-sm font-semibold text-white">Reward Information</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">Reward Rate:</span>
              <span className="text-white font-medium">
                {rewardRate ? `${formatEther(rewardRate)} DEBPOL/sec` : 'Loading...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Total Distributed:</span>
              <span className="text-white font-medium">
                {totalDistributed ? formatEther(totalDistributed) : '0'} DEBPOL
              </span>
            </div>
          </div>

          {/* Asset Multipliers */}
          <div className="pt-3 border-t border-white/10">
            <p className="text-xs font-semibold text-white/80 mb-2">Asset Reward Multipliers:</p>
            <div className="grid grid-cols-2 gap-2">
              {tokens.map(token => (
                <div key={token.symbol} className="flex justify-between text-xs">
                  <span className="text-white/70">{token.symbol}:</span>
                  <span className="text-white font-medium">{assetMultipliers[token.symbol] || '1.0x'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleUpdateRewards}
            disabled={!isConnected}
            className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-gray-500/20 text-blue-200 font-semibold rounded-lg transition-colors disabled:cursor-not-allowed border border-blue-300/30"
          >
            Update Rewards
          </button>

          <button
            onClick={handleClaimRewards}
            disabled={!isConnected || !hasRewards || isClaiming || isConfirming}
            className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
          >
            {isClaiming || isConfirming
              ? 'Claiming...'
              : isClaimSuccess
              ? 'Claimed!'
              : hasRewards
              ? `Claim ${rewardsAmount} DEBPOL`
              : 'No Rewards to Claim'}
          </button>
        </div>

        {!isConnected && (
          <div className="bg-yellow-500/20 border border-yellow-300/30 rounded-lg p-4 text-center">
            <p className="text-sm text-yellow-100">Connect your wallet to view rewards</p>
          </div>
        )}
      </div>
    </div>
  )
}


