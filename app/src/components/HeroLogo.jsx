import React from 'react'
import { motion } from 'framer-motion'

export function HeroLogo() {
  return (
    <motion.div
      className="w-full flex items-center justify-center py-6"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <motion.svg
        width="120"
        height="120"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
        whileHover={{ scale: 1.04, rotate: 2 }}
        transition={{ type: 'spring', stiffness: 220, damping: 15 }}
        aria-label="Polygon 3D logo"
      >
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
          <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* 3D chain-like hex links */}
        <g filter="url(#shadow)">
          <path d="M60 65 L100 42 L140 65 L140 110 L100 133 L60 110 Z" fill="url(#g1)" />
          <path d="M96 78 L124 62 L152 78 L152 104 L124 120 L96 104 Z" fill="url(#g2)" opacity="0.85" />
          <path d="M48 96 L76 80 L104 96 L104 122 L76 138 L48 122 Z" fill="url(#g2)" opacity="0.85" />
        </g>
      </motion.svg>
    </motion.div>
  )
}


