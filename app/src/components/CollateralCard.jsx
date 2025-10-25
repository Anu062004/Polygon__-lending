import React, { useEffect, useMemo, useState } from 'react'
import { ethers } from 'ethers'
import { useAccount, useChainId } from 'wagmi'
import { toast } from 'react-hot-toast'
import { CONTRACT_ADDRESSES, getAllTokens } from '../utils/contracts'

const LENDING_POOL_ABI = [
  'function depositCollateral(address token, uint256 amount)',
  'function withdraw(address asset, uint256 amount)',
  'function getUserCollateralValue(address user) view returns (uint256)',
  'function getBorrowableAmount(address user) view returns (uint256)',
  'function userCollateral(address user, address asset) view returns (uint256)',
]

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
]

const AMOY_CHAIN_ID = 80002
const AMOY_HEX = '0x13882'

export default function CollateralCard() {
  const { address } = useAccount()
  const chainId = useChainId()
  const TOKENS = useMemo(() => getAllTokens(), [])
  const LENDING_POOL_ADDRESS = useMemo(() => CONTRACT_ADDRESSES.lendingPool, [])
  const [selected, setSelected] = useState(() => getAllTokens()[0])
  const [amount, setAmount] = useState('')
  const [available, setAvailable] = useState('0')
  const [collateralUsd, setCollateralUsd] = useState('0.00')
  const [borrowableUsd, setBorrowableUsd] = useState('0.00')
  const [loading, setLoading] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  const provider = useMemo(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum)
    }
    return null
  }, [])

  const pool = useMemo(() => {
    if (!provider) return null
    return new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, provider)
  }, [provider, chainId])

  async function ensureAmoy() {
    if (!provider || typeof window === 'undefined' || !window.ethereum) return
    try {
      const net = await provider.getNetwork()
      if (Number(net.chainId) !== AMOY_CHAIN_ID) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: AMOY_HEX }],
        })
      }
    } catch (_) {
      // ignore user rejection or unsupported chain
    }
  }

  async function fetchAvailableForSelected() {
    if (!provider || !pool || !address || !selected) return
    try {
      const amt = await pool.userCollateral(address, selected.address)
      setAvailable(ethers.formatUnits(amt, selected.decimals))
    } catch (e) {
      // ignore
    }
  }

  async function fetchCollateralInfo() {
    if (!provider || !pool || !address) return
    if (chainId && chainId !== AMOY_CHAIN_ID) return
    try {
      const [cv, bl] = await Promise.all([
        pool.getUserCollateralValue(address),
        pool.getBorrowableAmount(address),
      ])
      setCollateralUsd(ethers.formatUnits(cv, 18))
      setBorrowableUsd(ethers.formatUnits(bl, 18))
    } catch (e) {
      if (e && typeof e.message === 'string' && e.message.includes('network changed')) {
        setTimeout(fetchCollateralInfo, 800)
        return
      }
      console.error(e)
    }
  }

  async function handleDepositCollateral() {
    if (!provider || !pool || !address) return
    if (chainId && chainId !== AMOY_CHAIN_ID) {
      await ensureAmoy()
      return
    }
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
      await fetchAvailableForSelected()
    } catch (e) {
      console.error(e)
      toast.error(e.shortMessage || e.message || 'Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleWithdraw() {
    if (!provider || !pool || !address) return
    if (chainId && chainId !== AMOY_CHAIN_ID) {
      await ensureAmoy()
      return
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Enter an amount to withdraw')
      return
    }
    const parsed = ethers.parseUnits(amount, selected.decimals)
    const availableBN = ethers.parseUnits(available || '0', selected.decimals)
    if (parsed > availableBN) {
      toast.error(`Insufficient collateral. Max: ${available}`)
      setAmount(available)
      return
    }
    setWithdrawing(true)
    try {
      const signer = await provider.getSigner()
      const poolW = pool.connect(signer)
      const tx = await poolW.withdraw(selected.address, parsed)
      await tx.wait()
      toast.success('Collateral withdrawn')
      setAmount('')
      await fetchCollateralInfo()
      await fetchAvailableForSelected()
    } catch (e) {
      console.error(e)
      const msg = typeof e?.message === 'string' ? e.message : ''
      if (msg.includes('Health factor too low')) {
        toast.error('Withdrawal would reduce health factor below 1. Repay first or withdraw less.')
      } else if (msg.includes('Insufficient collateral')) {
        toast.error('Insufficient collateral for this asset.')
      } else {
        toast.error(e.shortMessage || msg || 'Withdraw failed')
      }
    } finally {
      setWithdrawing(false)
    }
  }

  useEffect(() => {
    fetchCollateralInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, provider, chainId])

  useEffect(() => {
    fetchAvailableForSelected()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, address, provider, chainId])

  useEffect(() => {
    ensureAmoy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId])

  const wrongNetwork = chainId && chainId !== AMOY_CHAIN_ID

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-4">Collateral</h3>

      {wrongNetwork && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 text-sm flex items-center justify-between">
          <span>Wrong network. Please switch to Polygon Amoy.</span>
          <button
            onClick={ensureAmoy}
            className="ml-3 px-3 py-1 rounded-md bg-red-500/80 hover:bg-red-500 text-white"
          >
            Switch
          </button>
        </div>
      )}

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

      <div className="mb-2 text-xs text-indigo-200/80">
        Available: {available} {selected?.symbol}
      </div>

      <div className="mb-4 flex gap-2 items-center">
        <div className="flex-1">
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
        <button
          type="button"
          onClick={() => setAmount(available)}
          className="mt-7 px-3 py-2 rounded-lg border border-white/10 bg-slate-800/60 text-white hover:bg-slate-700"
        >
          Max
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleDepositCollateral}
          disabled={loading || wrongNetwork}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Collateral'}
        </button>
        <button
          onClick={handleWithdraw}
          disabled={withdrawing || wrongNetwork}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {withdrawing ? 'Withdrawing...' : 'Withdraw'}
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


