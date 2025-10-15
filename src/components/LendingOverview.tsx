'use client'

import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'

export function LendingOverview() {
  // Mock data - in real app, this would come from smart contracts
  const overviewData = {
    totalSupplied: 125000,
    totalBorrowed: 45000,
    netWorth: 80000,
    healthFactor: 2.5,
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
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
                {formatCurrency(overviewData.totalSupplied)}
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
                {formatCurrency(overviewData.totalBorrowed)}
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
                {formatCurrency(overviewData.netWorth)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Health Factor</p>
              <p className="text-2xl font-bold text-purple-700">
                {overviewData.healthFactor}x
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  )
}




