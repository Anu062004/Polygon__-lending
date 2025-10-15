import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { getContractAddresses } from '../utils/contracts'

export function useLendingData(address) {
  const [portfolioData, setPortfolioData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!address) {
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Mock data for now - in real implementation, this would fetch from contracts
        const mockData = {
          totalSupplied: 125000,
          totalBorrowed: 45000,
          netWorth: 80000,
          healthFactor: 2.5,
          assets: {
            mUSDC: {
              supplied: 1000,
              borrowed: 200,
              supplyRate: 3.2,
              borrowRate: 5.8,
            },
            mBTC: {
              supplied: 0.02,
              borrowed: 0,
              supplyRate: 1.5,
              borrowRate: 4.5,
            },
          },
        }

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setPortfolioData(mockData)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [address])

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



