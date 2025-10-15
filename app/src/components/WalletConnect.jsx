import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Wallet, Shield, Zap, TrendingUp } from 'lucide-react'

export function WalletConnect() {
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
        <ConnectButton />
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
          <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Profitable</h3>
          <p className="text-gray-600 text-sm">
            Earn interest on your deposits
          </p>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2">Getting Started</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>1. Connect your wallet using the button above</p>
          <p>2. Switch to Polygon Amoy testnet (Chain ID: 80002)</p>
          <p>3. Get test tokens from the faucet</p>
          <p>4. Start lending and borrowing!</p>
        </div>
      </div>
    </div>
  )
}



