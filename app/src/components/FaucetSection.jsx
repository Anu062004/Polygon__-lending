import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { Droplets, Coins } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getAllTokens } from '../utils/contracts'
import { useLendingDemo } from '../context/LendingDemoProvider'

export function FaucetSection() {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const demo = useLendingDemo()

  const tokens = getAllTokens()

  const handleMint = async (tokenSymbol) => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    setIsLoading(true)
    try {
      demo.actions.mintFromFaucet(tokenSymbol)
    } catch (error) {
      toast.error('Mint failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const faucetAmounts = {
    mUSDC: '10,000',
    mBTC: '0.1',
  }

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl ring-1 ring-black/5 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <Droplets className="h-6 w-6 text-blue-600 mr-2" />
        Test Token Faucet
      </h3>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Get test tokens to try the lending protocol. These tokens are only for testing on Polygon Amoy testnet.
          </p>
        </div>

        <div className="space-y-3">
          {tokens.map((token) => (
            <div key={token.symbol} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{token.icon}</div>
                <div>
                  <p className="font-medium text-gray-900">{token.symbol}</p>
                  <p className="text-sm text-gray-600">{token.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Amount: {faucetAmounts[token.symbol]}</p>
                <button
                  onClick={() => handleMint(token.symbol)}
                  disabled={isLoading}
                  className="mt-1 flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Coins className="h-4 w-4" />
                  <span>{isLoading ? 'Minting...' : 'Mint'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">Faucet Limits</h4>
          <div className="space-y-1 text-sm text-yellow-800">
            <p>• Maximum 10,000 mUSDC per day</p>
            <p>• Maximum 0.1 mBTC per day</p>
            <p>• Tokens are only for testing purposes</p>
            <p>• No real value on mainnet</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Getting Started</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p>1. Connect your wallet to Polygon Amoy testnet</p>
            <p>2. Get test tokens from the faucet above</p>
            <p>3. Start by supplying assets to earn interest</p>
            <p>4. Use supplied assets as collateral to borrow</p>
            <p>5. Monitor your health factor to avoid liquidation</p>
          </div>
        </div>

        <div className="text-center">
          <a
            href="https://faucet.polygon.technology/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 text-sm underline"
          >
            Need MATIC for gas? Get it from Polygon Faucet
          </a>
        </div>
      </div>
    </div>
  )
}



