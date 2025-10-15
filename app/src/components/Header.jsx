import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId } from 'wagmi'
import { TrendingUp, AlertCircle } from 'lucide-react'
import { polygonAmoy } from 'wagmi/chains'

export function Header() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const isCorrectNetwork = chainId === polygonAmoy.id

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Aave-style Lending Protocol
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
              <span>Polygon Amoy Testnet</span>
              <div className={`w-2 h-2 rounded-full ${isCorrectNetwork ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {!isCorrectNetwork && isConnected && (
                <div className="flex items-center space-x-1 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Wrong Network</span>
                </div>
              )}
            </div>
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  )
}



