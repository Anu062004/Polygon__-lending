import React from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { polygonAmoy } from 'wagmi/chains'
import { Toaster } from 'react-hot-toast'

import '@rainbow-me/rainbowkit/styles.css'
import './styles/index.css'

import { Dashboard } from './components/Dashboard'
import { Header } from './components/Header'

// Configure Wagmi
const config = getDefaultConfig({
  appName: 'Aave-style Lending Protocol',
  projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect project ID
  chains: [polygonAmoy],
  ssr: true,
})

// Create QueryClient
const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <Header />
            <main className="container mx-auto px-4 py-8">
              <Dashboard />
            </main>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App



