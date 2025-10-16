import React, { createContext, useContext, useMemo, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { getAllTokens } from '../utils/contracts'

const LendingDemoContext = createContext(null)

const PRICES_USD = { mUSDC: 1, mBTC: 50000 }
const COLLATERAL_FACTOR = 0.75

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function LendingDemoProvider({ children }) {
  const tokens = useMemo(() => getAllTokens(), [])

  const [balances, setBalances] = useState({ mUSDC: 1000, mBTC: 0.02 })
  const [supplied, setSupplied] = useState({ mUSDC: 500, mBTC: 0 })
  const [borrowed, setBorrowed] = useState({ mUSDC: 200, mBTC: 0 })

  const increase = (obj, key, delta) => ({ ...obj, [key]: toNumber(obj[key]) + toNumber(delta) })
  const decrease = (obj, key, delta) => ({ ...obj, [key]: Math.max(0, toNumber(obj[key]) - toNumber(delta)) })

  const supply = useCallback((symbol, amount) => {
    const amt = toNumber(amount)
    if (amt <= 0) throw new Error('Invalid amount')
    if (amt > toNumber(balances[symbol])) throw new Error('Insufficient balance')
    setBalances((b) => decrease(b, symbol, amt))
    setSupplied((s) => increase(s, symbol, amt))
    toast.success(`Supplied ${amt} ${symbol}`)
  }, [balances])

  const withdraw = useCallback((symbol, amount) => {
    const amt = toNumber(amount)
    if (amt <= 0) throw new Error('Invalid amount')
    if (amt > toNumber(supplied[symbol])) throw new Error('Insufficient supplied')
    setSupplied((s) => decrease(s, symbol, amt))
    setBalances((b) => increase(b, symbol, amt))
    toast.success(`Withdrew ${amt} ${symbol}`)
  }, [supplied])

  const borrow = useCallback((symbol, amount, maxBorrowUsd) => {
    const amt = toNumber(amount)
    if (amt <= 0) throw new Error('Invalid amount')
    const amtUsd = amt * PRICES_USD[symbol]
    if (amtUsd > maxBorrowUsd + 1e-9) throw new Error('Exceeds borrow limit')
    setBorrowed((s) => increase(s, symbol, amt))
    setBalances((b) => increase(b, symbol, amt))
    toast.success(`Borrowed ${amt} ${symbol}`)
  }, [])

  const repay = useCallback((symbol, amount) => {
    const amt = toNumber(amount)
    if (amt <= 0) throw new Error('Invalid amount')
    if (amt > toNumber(borrowed[symbol])) throw new Error('Exceeds debt')
    if (amt > toNumber(balances[symbol])) throw new Error('Insufficient balance')
    setBorrowed((s) => decrease(s, symbol, amt))
    setBalances((b) => decrease(b, symbol, amt))
    toast.success(`Repaid ${amt} ${symbol}`)
  }, [balances, borrowed])

  const mintFromFaucet = useCallback((symbol) => {
    const amount = symbol === 'mUSDC' ? 10000 : 0.1
    setBalances((b) => increase(b, symbol, amount))
    toast.success(`Minted ${amount} ${symbol}`)
  }, [])

  const liquidate = useCallback(() => {
    toast.success('Demo liquidation executed')
  }, [])

  const totalsUsd = useMemo(() => {
    const sum = (map) => tokens.reduce((acc, t) => acc + toNumber(map[t.symbol]) * PRICES_USD[t.symbol], 0)
    return {
      suppliedUsd: sum(supplied),
      borrowedUsd: sum(borrowed),
      balancesUsd: sum(balances),
    }
  }, [balances, borrowed, supplied, tokens])

  const netWorthUsd = totalsUsd.balancesUsd + totalsUsd.suppliedUsd - totalsUsd.borrowedUsd
  const borrowCapacityUsd = totalsUsd.suppliedUsd * COLLATERAL_FACTOR
  const availableToBorrowUsd = Math.max(0, borrowCapacityUsd - totalsUsd.borrowedUsd)
  const healthFactor = totalsUsd.borrowedUsd === 0 ? Infinity : (borrowCapacityUsd / totalsUsd.borrowedUsd)

  const value = useMemo(() => ({
    tokens,
    balances,
    supplied,
    borrowed,
    PRICES_USD,
    totalsUsd,
    netWorthUsd,
    borrowCapacityUsd,
    availableToBorrowUsd,
    healthFactor,
    actions: { supply, withdraw, borrow, repay, mintFromFaucet, liquidate },
  }), [tokens, balances, supplied, borrowed, totalsUsd, netWorthUsd, borrowCapacityUsd, availableToBorrowUsd, healthFactor, supply, withdraw, borrow, repay, mintFromFaucet, liquidate])

  return (
    <LendingDemoContext.Provider value={value}>{children}</LendingDemoContext.Provider>
  )
}

export function useLendingDemo() {
  const ctx = useContext(LendingDemoContext)
  if (!ctx) throw new Error('useLendingDemo must be used within LendingDemoProvider')
  return ctx
}



