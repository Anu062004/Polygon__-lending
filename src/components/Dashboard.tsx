'use client'

import { useState } from 'react'
import { WalletConnect } from '@/components/WalletConnect'
import { LendingOverview } from '@/components/LendingOverview'
import { SupplySection } from '@/components/SupplySection'
import { BorrowSection } from '@/components/BorrowSection'

export function Dashboard() {
  const [isConnected, setIsConnected] = useState(false)

  if (!isConnected) {
    return <WalletConnect onConnect={() => setIsConnected(true)} />
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Lending Dashboard
        </h2>
        <p className="text-gray-600">
          Supply assets to earn interest or borrow against your collateral
        </p>
      </div>

      <LendingOverview />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SupplySection />
        <BorrowSection />
      </div>
    </div>
  )
}
