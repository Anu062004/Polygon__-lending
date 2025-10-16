import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { AlertTriangle, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getAllTokens } from '../utils/contracts'
import { useLendingDemo } from '../context/LendingDemoProvider'

export function LiquidationSection() {
  const { address } = useAccount()
  const demo = useLendingDemo()
  const [collateralToken, setCollateralToken] = useState('mBTC')
  const [debtToken, setDebtToken] = useState('mUSDC')
  const [borrowerAddress, setBorrowerAddress] = useState('')
  const [debtAmount, setDebtAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const tokens = getAllTokens()

  const handleLiquidate = async () => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!borrowerAddress) {
      toast.error('Please enter borrower address')
      return
    }

    if (!debtAmount || parseFloat(debtAmount) <= 0) {
      toast.error('Please enter a valid debt amount')
      return
    }

    setIsLoading(true)
    try {
      demo.actions.liquidate()
      toast.success(`Liquidation successful! Received ${collateralToken} as reward.`)
      setBorrowerAddress('')
      setDebtAmount('')
    } catch (error) {
      toast.error('Liquidation failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const liquidatablePositions = [
    {
      borrower: '0x6b3a924379B9408D8110f10F084ca809863B378A',
      collateral: '0.02 mBTC',
      debt: '700 mUSDC',
      healthFactor: 0.85,
      liquidationBonus: '5%',
    },
    {
      borrower: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5d5C5',
      collateral: '1.5 mBTC',
      debt: '50000 mUSDC',
      healthFactor: 0.92,
      liquidationBonus: '5%',
    },
  ]

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl ring-1 ring-black/5 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
        Liquidation
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Collateral Asset
          </label>
          <select
            value={collateralToken}
            onChange={(e) => setCollateralToken(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {tokens.map((token) => (
              <option key={token.symbol} value={token.symbol}>
                {token.symbol} - {token.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Debt Asset
          </label>
          <select
            value={debtToken}
            onChange={(e) => setDebtToken(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {tokens.map((token) => (
              <option key={token.symbol} value={token.symbol}>
                {token.symbol} - {token.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Borrower Address
          </label>
          <input
            type="text"
            value={borrowerAddress}
            onChange={(e) => setBorrowerAddress(e.target.value)}
            placeholder="0x..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Debt Amount to Repay
          </label>
          <input
            type="number"
            value={debtAmount}
            onChange={(e) => setDebtAmount(e.target.value)}
            placeholder="0.00"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleLiquidate}
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap className="h-5 w-5" />
          <span>{isLoading ? 'Liquidating...' : 'Liquidate'}</span>
        </button>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-2">Liquidation Info</h4>
          <div className="space-y-1 text-sm text-red-800">
            <div className="flex justify-between">
              <span>Liquidation Bonus:</span>
              <span>5%</span>
            </div>
            <div className="flex justify-between">
              <span>Max Liquidation:</span>
              <span>50% of debt</span>
            </div>
            <div className="flex justify-between">
              <span>Health Factor Threshold:</span>
              <span>&lt; 1.0</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Liquidatable Positions</h4>
          <div className="space-y-2">
            {liquidatablePositions.map((position, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {position.borrower.slice(0, 6)}...{position.borrower.slice(-4)}
                    </p>
                    <p className="text-xs text-gray-600">
                      Collateral: {position.collateral} | Debt: {position.debt}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">
                      HF: {position.healthFactor}
                    </p>
                    <p className="text-xs text-gray-600">
                      Bonus: {position.liquidationBonus}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setBorrowerAddress(position.borrower)
                    setDebtAmount(position.debt.split(' ')[0])
                  }}
                  className="mt-2 w-full text-xs bg-red-100 text-red-700 py-1 px-2 rounded hover:bg-red-200 transition-colors"
                >
                  Use This Position
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}



