import React, { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { toast } from 'react-hot-toast'
import { Vote, Award, Clock, TrendingUp } from 'lucide-react'
import { CONTRACT_ADDRESSES, DEBPOL_TOKEN_ABI, ERC20_ABI } from '../utils/contracts'

export function GovernanceSection() {
  const { address, isConnected } = useAccount()
  const [delegateAddress, setDelegateAddress] = useState('')

  // Get DEBPOL token balance
  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESSES.debpolToken,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: isConnected && !!address,
  })

  // Get voting power
  const { data: votes } = useReadContract({
    address: CONTRACT_ADDRESSES.debpolToken,
    abi: DEBPOL_TOKEN_ABI,
    functionName: 'getVotes',
    args: [address],
    enabled: isConnected && !!address,
  })

  // Get vesting info
  const { data: vestingInfo } = useReadContract({
    address: CONTRACT_ADDRESSES.debpolToken,
    abi: DEBPOL_TOKEN_ABI,
    functionName: 'getTeamMemberInfo',
    args: [address],
    enabled: isConnected && !!address,
  })

  const { writeContract: writeDelegate, data: delegateHash, isPending: isDelegating } = useWriteContract()
  const { isLoading: isConfirmingDelegate, isSuccess: isDelegateSuccess } = useWaitForTransactionReceipt({
    hash: delegateHash,
  })

  const { writeContract: writeClaim, data: claimHash, isPending: isClaiming } = useWriteContract()
  const { isLoading: isConfirmingClaim, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  })

  const handleDelegate = async (e) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error('Please connect your wallet')
      return
    }

    if (!delegateAddress || !delegateAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error('Please enter a valid address')
      return
    }

    try {
      writeDelegate({
        address: CONTRACT_ADDRESSES.debpolToken,
        abi: DEBPOL_TOKEN_ABI,
        functionName: 'delegate',
        args: [delegateAddress],
      })
    } catch (error) {
      console.error('Delegate error:', error)
      toast.error(error.message || 'Delegation failed')
    }
  }

  const handleClaimVested = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      writeClaim({
        address: CONTRACT_ADDRESSES.debpolToken,
        abi: DEBPOL_TOKEN_ABI,
        functionName: 'claimVestedTokens',
      })
    } catch (error) {
      console.error('Claim error:', error)
      toast.error(error.message || 'Claim failed')
    }
  }

  useEffect(() => {
    if (isDelegateSuccess) {
      toast.success('Voting power delegated successfully!')
      setDelegateAddress('')
    }
    if (isClaimSuccess) {
      toast.success('Vested tokens claimed successfully!')
    }
  }, [isDelegateSuccess, isClaimSuccess])

  const hasVesting = vestingInfo && vestingInfo[0] > 0n
  const vestedAmount = vestingInfo && vestingInfo[2] > 0n ? formatEther(vestingInfo[2]) : '0'

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <Vote className="w-6 h-6 text-indigo-400" />
        <h3 className="text-xl font-bold text-white">Governance</h3>
      </div>

      <div className="space-y-6">
        {/* Token Balance & Voting Power */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-white/70">DEBPOL Balance</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {balance ? formatEther(balance) : '0'}
            </p>
            <p className="text-xs text-white/60 mt-1">DEBPOL</p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-sm text-white/70">Voting Power</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {votes ? formatEther(votes) : '0'}
            </p>
            <p className="text-xs text-white/60 mt-1">Votes</p>
          </div>
        </div>

        {/* Vesting Info */}
        {hasVesting && (
          <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-300/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-purple-300" />
              <span className="text-sm font-semibold text-white">Vesting Information</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Total Allocation:</span>
                <span className="text-white font-medium">{formatEther(vestingInfo[0])} DEBPOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Claimed:</span>
                <span className="text-white font-medium">{formatEther(vestingInfo[1])} DEBPOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Available to Claim:</span>
                <span className="text-white font-semibold">{vestedAmount} DEBPOL</span>
              </div>
              {parseFloat(vestedAmount) > 0 && (
                <button
                  onClick={handleClaimVested}
                  disabled={isClaiming || isConfirmingClaim}
                  className="w-full mt-3 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {isClaiming || isConfirmingClaim ? 'Claiming...' : 'Claim Vested Tokens'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Delegate Voting Power */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Delegate Voting Power</h4>
          <form onSubmit={handleDelegate} className="space-y-3">
            <input
              type="text"
              value={delegateAddress}
              onChange={(e) => setDelegateAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!isConnected || isDelegating || isConfirmingDelegate || !delegateAddress}
              className="w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isDelegating || isConfirmingDelegate
                ? 'Delegating...'
                : isDelegateSuccess
                ? 'Delegated!'
                : 'Delegate Voting Power'}
            </button>
          </form>
          <p className="text-xs text-white/60 mt-2">
            Delegate your voting power to participate in governance proposals
          </p>
        </div>

        {!isConnected && (
          <div className="bg-yellow-500/20 border border-yellow-300/30 rounded-lg p-4 text-center">
            <p className="text-sm text-yellow-100">Connect your wallet to view governance information</p>
          </div>
        )}
      </div>
    </div>
  )
}


