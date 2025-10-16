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
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-white/30">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-9 w-9 text-indigo-600" />
            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              DebPol
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3 text-sm text-gray-700">
              <span className="px-2 py-1 rounded-full bg-gray-100">Polygon Amoy</span>
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



