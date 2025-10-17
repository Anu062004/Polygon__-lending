import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Wallet, Shield, Zap, TrendingUp, ArrowRight, Lock, Globe, DollarSign, BarChart3, Users, CheckCircle } from 'lucide-react'

export function WalletConnect() {
  return (
    <div className="min-h-screen -mt-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>
        
        <div className="relative container mx-auto px-4 pt-20 pb-32">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-indigo-100 mb-8 hover:scale-105 transition-transform duration-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              <span className="text-sm font-medium text-gray-700">Live on Polygon Amoy</span>
            </div>
            {/* Removed in-hero 3D polygon; fullscreen background remains */}
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-extrabold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] mb-6 leading-tight">
              <span className="block">Decentralized</span>
              <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                Lending Protocol
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-indigo-100/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] mb-12 max-w-3xl mx-auto leading-relaxed">
              Supply assets to earn interest or borrow against your collateral. 
              Built on Polygon for fast, secure, and low-cost transactions.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <div className="transform hover:scale-105 transition-all duration-200">
                <ConnectButton />
              </div>
              <a 
                href="#features" 
                className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border border-indigo-100 hover:border-indigo-300"
              >
                Learn More
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-shadow duration-300">
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  0%
                </div>
                <div className="text-gray-600 font-medium">Platform Fees</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-shadow duration-300">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Instant
                </div>
                <div className="text-gray-600 font-medium">Settlements</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-shadow duration-300">
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  24/7
                </div>
                <div className="text-gray-600 font-medium">Available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-24 fill-current text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Why Choose DebPol?
        </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Experience the future of decentralized finance with our cutting-edge lending protocol
        </p>
      </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {/* Secure */}
              <div className="group bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-green-100 hover:border-green-300 hover:-translate-y-2">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
      </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Secure</h3>
                <p className="text-gray-600 leading-relaxed">
                  Battle-tested smart contracts protect your assets with multi-layered security protocols
          </p>
        </div>
        
              {/* Fast */}
              <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-blue-100 hover:border-blue-300 hover:-translate-y-2">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Fast</h3>
                <p className="text-gray-600 leading-relaxed">
                  Lightning-fast transactions on Polygon network with minimal gas fees and instant confirmations
          </p>
        </div>
        
              {/* Decentralized */}
              <div className="group bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-purple-100 hover:border-purple-300 hover:-translate-y-2">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Decentralized</h3>
                <p className="text-gray-600 leading-relaxed">
                  No middlemen, no gatekeepers. Full control of your assets, accessible from anywhere
          </p>
        </div>
      </div>

            {/* Additional Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300">
                <div className="bg-indigo-100 rounded-lg p-3">
                  <DollarSign className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Competitive Interest Rates</h4>
                  <p className="text-gray-600 text-sm">Earn attractive yields on your deposits with dynamic interest rate models</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300">
                <div className="bg-purple-100 rounded-lg p-3">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Real-time Analytics</h4>
                  <p className="text-gray-600 text-sm">Monitor your portfolio with comprehensive dashboards and live updates</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300">
                <div className="bg-green-100 rounded-lg p-3">
                  <Lock className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Non-Custodial</h4>
                  <p className="text-gray-600 text-sm">You hold the keys. Your assets remain in your control at all times</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-pink-300 hover:shadow-lg transition-all duration-300">
                <div className="bg-pink-100 rounded-lg p-3">
                  <Users className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Community Driven</h4>
                  <p className="text-gray-600 text-sm">Built for the community, by the community with transparent governance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Get Started in Minutes
              </h2>
              <p className="text-xl text-gray-600">
                Start earning or borrowing in just 4 simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { number: '01', title: 'Connect Wallet', desc: 'Use MetaMask or any Web3 wallet', icon: Wallet },
                { number: '02', title: 'Switch Network', desc: 'Connect to Polygon Amoy testnet', icon: Globe },
                { number: '03', title: 'Get Tokens', desc: 'Use our faucet for test tokens', icon: DollarSign },
                { number: '04', title: 'Start Trading', desc: 'Supply, borrow, and earn!', icon: TrendingUp }
              ].map((step, index) => (
                <div key={index} className="relative bg-white rounded-2xl p-6 shadow-lg border border-indigo-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="text-6xl font-bold text-indigo-100 mb-4">{step.number}</div>
                  <step.icon className="h-10 w-10 text-indigo-600 mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.desc}</p>
                  <CheckCircle className="absolute top-4 right-4 h-5 w-5 text-green-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
        
        <div className="relative container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-indigo-100 mb-10">
              Join thousands of users who are already earning passive income with DebPol
            </p>
            <div className="transform hover:scale-105 transition-all duration-200 inline-block">
              <ConnectButton />
            </div>
        </div>
      </div>
      </section>
    </div>
  )
}



