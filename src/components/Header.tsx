'use client'

import { Wallet, TrendingUp } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Lending Protocol
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
              <span>Polygon Amoy Testnet</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
