import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getAllTokens } from '../utils/contracts'
import { useLendingDemo } from '../context/LendingDemoProvider'

export function BorrowSection() {
  const { address } = useAccount()
  const demo = useLendingDemo()
  const [selectedToken, setSelectedToken] = useState('mUSDC')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const tokens = getAllTokens()

  const handleBorrow = async () => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsLoading(true)
    try {
      demo.actions.borrow(selectedToken, amount, demo.availableToBorrowUsd)
      setAmount('')
    } catch (error) {
      toast.error('Borrow failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRepay = async () => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsLoading(true)
    try {
      demo.actions.repay(selectedToken, amount)
      setAmount('')
    } catch (error) {
      toast.error('Repay failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const setMaxAmount = () => {
    // Mock max amount based on collateral
    const maxAmount = selectedToken === 'mUSDC' ? '700' : '0.01'
    setAmount(maxAmount)
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur rounded-2xl shadow-xl ring-1 ring-white/10 p-6">
      <h3 className="text-xl font-semibold text-white mb-6">
        Borrow Assets
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-indigo-100/80 mb-2">
            Select Asset
          </label>
          <div className="grid grid-cols-2 gap-2">
            {tokens.map((token) => (
              <button
                key={token.symbol}
                onClick={() => setSelectedToken(token.symbol)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  selectedToken === token.symbol
                    ? 'border-orange-400/60 bg-slate-800/60 shadow'
                    : 'border-white/10 hover:border-white/20 hover:shadow'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">{token.icon}</div>
                  <div className="text-sm font-medium text-white">{token.symbol}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-indigo-100/80 mb-2">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-3 border border-white/10 bg-slate-800/60 text-white placeholder-white/40 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-16"
            />
            <button
              onClick={setMaxAmount}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-indigo-300 hover:text-indigo-200 font-medium"
            >
              MAX
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleBorrow}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpRight className="h-5 w-5" />
            <span>{isLoading ? 'Borrowing...' : 'Borrow'}</span>
          </button>
          
          <button
            onClick={handleRepay}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownLeft className="h-5 w-5" />
            <span>{isLoading ? 'Repaying...' : 'Repay'}</span>
          </button>
        </div>

        <div className="bg-slate-800/60 rounded-lg p-4 border border-white/10">
          <h4 className="font-medium text-white mb-2">Borrow Info</h4>
          <div className="space-y-1 text-sm text-indigo-100/80">
            <div className="flex justify-between">
              <span>Borrow APY:</span>
              <span className="text-red-300">5.8%</span>
            </div>
            <div className="flex justify-between">
              <span>Available to Borrow (USD):</span>
              <span>{Math.floor(demo.availableToBorrowUsd)}</span>
            </div>
            <div className="flex justify-between">
              <span>Borrowed:</span>
              <span>{demo.borrowed[selectedToken]} {selectedToken}</span>
            </div>
            <div className="flex justify-between">
              <span>Collateral Factor:</span>
              <span>75%</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <div className="text-yellow-300">⚠️</div>
            <div className="text-sm text-yellow-200">
              <p className="font-medium">Health Factor Warning</p>
              <p className="text-yellow-300">Keep your health factor above 1.5 to avoid liquidation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



