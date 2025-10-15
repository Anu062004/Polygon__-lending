import React from 'react'
import { useAccount } from 'wagmi'
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'
import { useLendingData } from '../hooks/useLendingData'

export function PortfolioOverview() {
  const { address } = useAccount()
  const { portfolioData, isLoading } = useLendingData(address)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Portfolio Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getHealthFactorColor = (hf) => {
    if (hf >= 2) return 'text-green-600'
    if (hf >= 1.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthFactorText = (hf) => {
    if (hf === Infinity) return '∞ (No Debt)'
    return `${hf.toFixed(2)}x`
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        Portfolio Overview
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Supplied</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(portfolioData?.totalSupplied || 0)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Total Borrowed</p>
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(portfolioData?.totalBorrowed || 0)}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Net Worth</p>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(portfolioData?.netWorth || 0)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Health Factor</p>
              <p className={`text-2xl font-bold ${getHealthFactorColor(portfolioData?.healthFactor || 0)}`}>
                {getHealthFactorText(portfolioData?.healthFactor || 0)}
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {portfolioData?.healthFactor && portfolioData.healthFactor < 1.5 && portfolioData.healthFactor !== Infinity && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <div className="text-yellow-600">⚠️</div>
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Health Factor Warning</p>
              <p>Your health factor is below 1.5. Consider adding more collateral or repaying debt to avoid liquidation.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



