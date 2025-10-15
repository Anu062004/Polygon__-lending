'use client'

import { Wallet, Shield, Zap } from 'lucide-react'

interface WalletConnectProps {
  onConnect: () => void
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <div className="mb-8">
        <Wallet className="h-16 w-16 text-primary-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600 text-lg">
          Connect your wallet to start lending and borrowing on Polygon Amoy testnet
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <button 
          onClick={onConnect}
          className="bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition-colors text-lg font-semibold"
        >
          Connect Wallet (Demo)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="text-center">
          <Shield className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Secure</h3>
          <p className="text-gray-600 text-sm">
            Your assets are protected by smart contracts
          </p>
        </div>
        
        <div className="text-center">
          <Zap className="h-12 w-12 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Fast</h3>
          <p className="text-gray-600 text-sm">
            Quick transactions on Polygon network
          </p>
        </div>
        
        <div className="text-center">
          <Wallet className="h-12 w-12 text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Easy</h3>
          <p className="text-gray-600 text-sm">
            Simple interface for DeFi operations
          </p>
        </div>
      </div>
    </div>
  )
}
