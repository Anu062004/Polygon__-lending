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
import { LendingDemoProvider } from './context/LendingDemoProvider'
import { Fullscreen3DBackground } from './components/Fullscreen3DBackground'

// Configure Wagmi
const config = getDefaultConfig({
  appName: 'DebPol',
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
          <LendingDemoProvider>
            <div className="min-h-screen relative">
              <Fullscreen3DBackground />
              <Header />
              <main>
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
          </LendingDemoProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App



