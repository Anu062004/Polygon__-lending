import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { Plus, Minus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getAllTokens } from '../utils/contracts'
import { useLendingDemo } from '../context/LendingDemoProvider'

export function SupplySection() {
  const { address } = useAccount()
  const demo = useLendingDemo()
  const [selectedToken, setSelectedToken] = useState('mUSDC')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const tokens = getAllTokens()

  const handleSupply = async () => {
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
      demo.actions.supply(selectedToken, amount)
      setAmount('')
    } catch (error) {
      toast.error('Supply failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async () => {
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
      demo.actions.withdraw(selectedToken, amount)
      setAmount('')
    } catch (error) {
      toast.error('Withdraw failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const setMaxAmount = () => {
    // Mock max amount
    const maxAmount = selectedToken === 'mUSDC' ? '1000' : '0.02'
    setAmount(maxAmount)
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur rounded-2xl shadow-xl ring-1 ring-white/10 p-6">
      <h3 className="text-xl font-semibold text-white mb-6">
        Supply Assets
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
                    ? 'border-indigo-400/60 bg-slate-800/60 shadow'
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
            onClick={handleSupply}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-5 w-5" />
            <span>{isLoading ? 'Supplying...' : 'Supply'}</span>
          </button>
          
          <button
            onClick={handleWithdraw}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="h-5 w-5" />
            <span>{isLoading ? 'Withdrawing...' : 'Withdraw'}</span>
          </button>
        </div>

        <div className="bg-slate-800/60 rounded-lg p-4 border border-white/10">
          <h4 className="font-medium text-white mb-2">Supply Info</h4>
          <div className="space-y-1 text-sm text-indigo-100/80">
            <div className="flex justify-between">
              <span>Supply APY:</span>
              <span className="text-green-300">3.2%</span>
            </div>
            <div className="flex justify-between">
              <span>Available:</span>
              <span>{demo.balances[selectedToken]} {selectedToken}</span>
            </div>
            <div className="flex justify-between">
              <span>Supplied:</span>
              <span>{demo.supplied[selectedToken]} {selectedToken}</span>
            </div>
            <div className="flex justify-between">
              <span>Collateral Factor:</span>
              <span>75%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



