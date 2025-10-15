'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { config } from '@/lib/config'

export function SupplySection() {
  const [selectedToken, setSelectedToken] = useState('USDC')
  const [amount, setAmount] = useState('')

  const handleSupply = () => {
    // Mock supply action
    console.log(`Supplying ${amount} ${selectedToken}`)
    alert(`Supplying ${amount} ${selectedToken} - This is a demo!`)
  }

  const handleWithdraw = () => {
    // Mock withdraw action
    console.log(`Withdrawing ${amount} ${selectedToken}`)
    alert(`Withdrawing ${amount} ${selectedToken} - This is a demo!`)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        Supply Assets
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Asset
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(config.tokens).map(([key, token]) => (
              <button
                key={key}
                onClick={() => setSelectedToken(key)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  selectedToken === key
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
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSupply}
            className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Supply</span>
          </button>
          
          <button
            onClick={handleWithdraw}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Minus className="h-5 w-5" />
            <span>Withdraw</span>
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Supply Info</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Supply APY:</span>
              <span className="text-green-600">3.2%</span>
            </div>
            <div className="flex justify-between">
              <span>Available:</span>
              <span>1,000 {selectedToken}</span>
            </div>
            <div className="flex justify-between">
              <span>Supplied:</span>
              <span>500 {selectedToken}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}




