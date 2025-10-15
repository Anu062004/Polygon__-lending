import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getAllTokens } from '../utils/contracts'

export function BorrowSection() {
  const { address } = useAccount()
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
      // Mock borrow action
      console.log(`Borrowing ${amount} ${selectedToken}`)
      toast.success(`Borrowed ${amount} ${selectedToken} successfully!`)
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
      // Mock repay action
      console.log(`Repaying ${amount} ${selectedToken}`)
      toast.success(`Repaid ${amount} ${selectedToken} successfully!`)
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        Borrow Assets
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Asset
          </label>
          <div className="grid grid-cols-2 gap-2">
            {tokens.map((token) => (
              <button
                key={token.symbol}
                onClick={() => setSelectedToken(token.symbol)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  selectedToken === token.symbol
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">{token.icon}</div>
                  <div className="text-sm font-medium">{token.symbol}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-16"
            />
            <button
              onClick={setMaxAmount}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-primary-600 hover:text-primary-700 font-medium"
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

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Borrow Info</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Borrow APY:</span>
              <span className="text-red-600">5.8%</span>
            </div>
            <div className="flex justify-between">
              <span>Available to Borrow:</span>
              <span>2,500 {selectedToken}</span>
            </div>
            <div className="flex justify-between">
              <span>Borrowed:</span>
              <span>1,200 {selectedToken}</span>
            </div>
            <div className="flex justify-between">
              <span>Collateral Factor:</span>
              <span>75%</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <div className="text-yellow-600">⚠️</div>
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Health Factor Warning</p>
              <p>Keep your health factor above 1.5 to avoid liquidation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



