import React from 'react'
import { useAccount, useChainId } from 'wagmi'
import { polygonAmoy } from 'wagmi/chains'

import { WalletConnect } from './WalletConnect'
import { MarketTable } from './MarketTable'
import { PortfolioOverview } from './PortfolioOverview'
import { SupplySection } from './SupplySection'
import CollateralCard from './CollateralCard'
import { BorrowSection } from './BorrowSection'
import { LiquidationSection } from './LiquidationSection'
import { FaucetSection } from './FaucetSection'

export function Dashboard() {
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const isCorrectNetwork = chainId === polygonAmoy.id

  if (!isConnected) {
    return <WalletConnect />
  }

  if (!isCorrectNetwork) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-yellow-800 mb-4">
            Wrong Network
          </h2>
          <p className="text-yellow-700 mb-6">
            Please switch to Polygon Amoy testnet to use the lending protocol.
          </p>
          <div className="text-sm text-yellow-600">
            <p>Network ID: 80002</p>
            <p>RPC URL: https://rpc-amoy.polygon.technology/</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] mb-2">
            Lending Dashboard
          </h2>
          <p className="text-indigo-100/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]">
            Supply assets to earn interest or borrow against your collateral
          </p>
          <p className="text-sm text-indigo-100/80 drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)] mt-2">
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>

        <PortfolioOverview />

        <MarketTable />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <CollateralCard />
          <SupplySection />
          <BorrowSection />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <LiquidationSection />
          <FaucetSection />
        </div>
      </div>
    </div>
  )
}



