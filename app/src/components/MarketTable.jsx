import React from 'react'
import { motion } from 'framer-motion'
import { useLendingDemo } from '../context/LendingDemoProvider'

export function MarketTable() {
  const demo = useLendingDemo()
  const rows = demo.tokens.map((t) => ({
    symbol: t.symbol,
    price: demo.PRICES_USD[t.symbol],
    supplied: demo.supplied[t.symbol],
    borrowed: demo.borrowed[t.symbol],
  }))

  return (
    <motion.div className="bg-slate-900/60 backdrop-blur rounded-2xl shadow-xl ring-1 ring-white/10"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
    >
      <div className="border-b border-white/10 px-6 py-4">
        <h3 className="text-xl font-semibold text-white">Markets</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
        {/* Lending side */}
        <div>
          <div className="px-6 py-3 text-sm font-medium text-indigo-100/80">Lending</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-indigo-200/80">
                  <th className="px-6 py-2">Asset</th>
                  <th className="px-6 py-2">Price</th>
                  <th className="px-6 py-2">You Supplied</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <motion.tr key={`lend-${r.symbol}`} className="border-t border-white/10" whileHover={{ backgroundColor: 'rgba(30,41,59,0.6)' }}>
                    <td className="px-6 py-3 font-medium text-white">{r.symbol}</td>
                    <td className="px-6 py-3">${r.price.toLocaleString()}</td>
                    <td className="px-6 py-3">{r.supplied} {r.symbol}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Borrowing side */}
        <div>
          <div className="px-6 py-3 text-sm font-medium text-indigo-100/80">Borrowing</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-indigo-200/80">
                  <th className="px-6 py-2">Asset</th>
                  <th className="px-6 py-2">Price</th>
                  <th className="px-6 py-2">You Borrowed</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <motion.tr key={`borrow-${r.symbol}`} className="border-t border-white/10" whileHover={{ backgroundColor: 'rgba(30,41,59,0.6)' }}>
                    <td className="px-6 py-3 font-medium text-white">{r.symbol}</td>
                    <td className="px-6 py-3">${r.price.toLocaleString()}</td>
                    <td className="px-6 py-3">{r.borrowed} {r.symbol}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  )
}


