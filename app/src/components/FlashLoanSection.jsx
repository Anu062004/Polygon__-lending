import React, { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { toast } from 'react-hot-toast'
import { Zap, AlertCircle } from 'lucide-react'
import { CONTRACT_ADDRESSES, FLASH_LOAN_PROVIDER_ABI, getTokenInfo } from '../utils/contracts'
import { getAllTokens } from '../utils/contracts'

export function FlashLoanSection() {
  const { address, isConnected } = useAccount()
  const [selectedAsset, setSelectedAsset] = useState('mUSDC')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const tokens = getAllTokens()
  const tokenInfo = getTokenInfo(selectedAsset)

  // Get max flash loan amount
  const { data: maxAmount } = useReadContract({
    address: CONTRACT_ADDRESSES.flashLoanProvider,
    abi: FLASH_LOAN_PROVIDER_ABI,
    functionName: 'getMaxFlashLoan',
    args: [tokenInfo?.address],
    enabled: isConnected && !!tokenInfo?.address,
  })

  // Get flash loan fee
  const { data: feeBps } = useReadContract({
    address: CONTRACT_ADDRESSES.flashLoanProvider,
    abi: FLASH_LOAN_PROVIDER_ABI,
    functionName: 'getFlashLoanFee',
    enabled: isConnected,
  })

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handleFlashLoan = async (e) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error('Please connect your wallet')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!tokenInfo) {
      toast.error('Please select a token')
      return
    }

    setIsLoading(true)

    try {
      const amountWei = BigInt(parseFloat(amount) * 10 ** tokenInfo.decimals)
      
      // Note: Flash loans require implementing a receiver contract
      // This is a simplified UI for demonstration
      toast.error('Flash loans require implementing a receiver contract. Please use the contract interface directly.')
      
      // For actual implementation, you would call:
      // writeContract({
      //   address: CONTRACT_ADDRESSES.flashLoanProvider,
      //   abi: FLASH_LOAN_PROVIDER_ABI,
      //   functionName: 'flashLoan',
      //   args: [tokenInfo.address, amountWei, receiverAddress, params],
      // })
    } catch (error) {
      console.error('Flash loan error:', error)
      toast.error(error.message || 'Flash loan failed')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateFee = (amt) => {
    if (!amt || !feeBps) return '0'
    const fee = (parseFloat(amt) * Number(feeBps)) / 10000
    return fee.toFixed(6)
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-6 h-6 text-yellow-400" />
        <h3 className="text-xl font-bold text-white">Flash Loans</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-yellow-50/10 border border-yellow-200/30 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-100">
              <p className="font-semibold mb-1">Flash Loan Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-50/90">
                <li>You need to implement a receiver contract that implements IFlashLoanReceiver</li>
                <li>The contract must repay the loan + fee in the same transaction</li>
                <li>Flash loan fee: {feeBps ? `${Number(feeBps) / 100}%` : '0.09%'}</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleFlashLoan} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Select Asset
            </label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {tokens.map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.icon} {token.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Amount
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                step="0.000001"
                min="0"
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setAmount(maxAmount ? (Number(maxAmount) / 10 ** tokenInfo.decimals).toString() : '')}
                className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 rounded-lg text-sm font-medium transition-colors"
              >
                Max
              </button>
            </div>
            {maxAmount && (
              <p className="text-xs text-white/70 mt-1">
                Max available: {(Number(maxAmount) / 10 ** tokenInfo.decimals).toLocaleString()} {selectedAsset}
              </p>
            )}
          </div>

          {amount && parseFloat(amount) > 0 && (
            <div className="bg-white/5 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Flash Loan Amount:</span>
                <span className="text-white font-medium">{amount} {selectedAsset}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Fee ({feeBps ? `${Number(feeBps) / 100}%` : '0.09%'}):</span>
                <span className="text-white font-medium">{calculateFee(amount)} {selectedAsset}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                <span className="text-white/70">Total to Repay:</span>
                <span className="text-white font-semibold">
                  {(parseFloat(amount) + parseFloat(calculateFee(amount))).toFixed(6)} {selectedAsset}
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!isConnected || isLoading || isPending || isConfirming || !amount}
            className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
          >
            {isLoading || isPending || isConfirming
              ? 'Processing...'
              : isSuccess
              ? 'Flash Loan Executed!'
              : 'Execute Flash Loan (Requires Contract)'}
          </button>
        </form>
      </div>
    </div>
  )
}


