import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useLendingDemo } from '../context/LendingDemoProvider'

export function useLendingData(address) {
  const [portfolioData, setPortfolioData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const demo = useLendingDemo()

  useEffect(() => {
    if (!address) {
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        await new Promise(r => setTimeout(r, 200))
        setPortfolioData({
          totalSupplied: demo.totalsUsd.suppliedUsd,
          totalBorrowed: demo.totalsUsd.borrowedUsd,
          netWorth: demo.netWorthUsd,
          healthFactor: demo.healthFactor,
          assets: {
            mUSDC: { supplied: demo.supplied.mUSDC, borrowed: demo.borrowed.mUSDC, supplyRate: 3.2, borrowRate: 5.8 },
            mBTC: { supplied: demo.supplied.mBTC, borrowed: demo.borrowed.mBTC, supplyRate: 1.5, borrowRate: 4.5 },
          },
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [address, demo])

  return { portfolioData, isLoading, error }
}

export function useMarketData() {
  const [marketData, setMarketData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Mock market data
        const mockData = {
          totalValueLocked: 2500000,
          totalBorrowed: 800000,
          utilization: 32,
          assets: {
            mUSDC: {
              totalSupply: 1000000,
              totalBorrow: 400000,
              supplyRate: 3.2,
              borrowRate: 5.8,
              price: 1,
            },
            mBTC: {
              totalSupply: 500000,
              totalBorrow: 200000,
              supplyRate: 1.5,
              borrowRate: 4.5,
              price: 50000,
            },
          },
        }

        await new Promise(resolve => setTimeout(resolve, 500))
        setMarketData(mockData)
      } catch (err) {
        console.error('Error fetching market data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return { marketData, isLoading }
}



