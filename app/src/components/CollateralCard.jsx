import React, { useEffect, useMemo, useState } from 'react'
import { ethers } from 'ethers'
import { useAccount } from 'wagmi'
import { toast } from 'react-hot-toast'
import { CONTRACT_ADDRESSES, getAllTokens } from '../utils/contracts'

const LENDING_POOL_ABI = [
  'function depositCollateral(address token, uint256 amount)',
  'function getUserCollateralValue(address user) view returns (uint256)',
  'function getBorrowableAmount(address user) view returns (uint256)',
]

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
]

export default function CollateralCard() {
  const { address } = useAccount()
  const TOKENS = useMemo(() => getAllTokens(), [])
  const LENDING_POOL_ADDRESS = useMemo(() => CONTRACT_ADDRESSES.lendingPool, [])
  const [selected, setSelected] = useState(() => getAllTokens()[0])
  const [amount, setAmount] = useState('')
  const [collateralUsd, setCollateralUsd] = useState('0.00')
  const [borrowableUsd, setBorrowableUsd] = useState('0.00')
  const [loading, setLoading] = useState(false)

  const provider = useMemo(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum)
    }
    return null
  }, [])

  const pool = useMemo(() => {
    if (!provider) return null
    return new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, provider)
  }, [provider])

  async function fetchCollateralInfo() {
    if (!provider || !pool || !address) return
    try {
      const [cv, bl] = await Promise.all([
        pool.getUserCollateralValue(address),
        pool.getBorrowableAmount(address),
      ])
      setCollateralUsd(ethers.formatUnits(cv, 18))
      setBorrowableUsd(ethers.formatUnits(bl, 18))
    } catch (e) {
      console.error(e)
    }
  }

  async function handleDepositCollateral() {
    if (!provider || !pool || !address) return
    if (!amount || Number(amount) <= 0) {
      toast.error('Enter an amount')
      return
    }
    setLoading(true)
    try {
      const signer = await provider.getSigner()
      const poolW = pool.connect(signer)
      const token = new ethers.Contract(selected.address, ERC20_ABI, signer)
      const parsed = ethers.parseUnits(amount, selected.decimals)

      // Some tokens (or misconfigured addresses) may not implement allowance correctly.
      // Wrap in try/catch and treat missing/zero as 0 allowance.
      let allow = 0n
      try {
        allow = await token.allowance(address, LENDING_POOL_ADDRESS)
      } catch (e) {
        console.warn('allowance() failed, proceeding to approve()', e)
        allow = 0n
      }
      if (allow < parsed) {
        const txA = await token.approve(LENDING_POOL_ADDRESS, parsed)
        await txA.wait()
      }

      const tx = await poolW.depositCollateral(selected.address, parsed)
      await tx.wait()
      toast.success('Collateral deposited')
      setAmount('')
      await fetchCollateralInfo()
    } catch (e) {
      console.error(e)
      toast.error(e.shortMessage || e.message || 'Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollateralInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, provider])

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-4">Collateral</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {TOKENS.map((t) => (
          <button
            key={t.symbol}
            onClick={() => setSelected(t)}
            className={`p-3 rounded-xl border-2 transition-all ${
              selected.symbol === t.symbol
                ? 'border-purple-400/60 bg-slate-800/60 shadow'
                : 'border-white/10 hover:border-white/20 hover:shadow'
            }`}
          >
            <div className="text-center">
              <div className="text-sm font-medium text-white">{t.symbol}</div>
              <div className="text-xs text-indigo-200/80">decimals: {t.decimals}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-indigo-100/80 mb-2">Amount</label>
        <input
          type="number"
          value={amount}
          min="0"
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full p-3 border border-white/10 bg-slate-800/60 text-white placeholder-white/40 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleDepositCollateral}
          disabled={loading}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Collateral'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 rounded-xl p-4 border border-white/10">
          <div className="text-sm text-indigo-100/80">Collateral Value (USD)</div>
          <div className="text-2xl font-bold text-white">${Number(collateralUsd).toLocaleString()}</div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4 border border-white/10">
          <div className="text-sm text-indigo-100/80">Borrow Limit (75%)</div>
          <div className="text-2xl font-bold text-white">${Number(borrowableUsd).toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}


