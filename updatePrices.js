/*
  Live price updater for PriceOracleMock.sol
  - Fetches BTC, ETH, MATIC prices from CoinGecko every 60s
  - Converts to 8‑decimals integers expected by the oracle
  - Calls setPrices(tokens, prices) on the deployed oracle

  Env (.env)
  - RPC_URL=<your_rpc_url>
  - PRIVATE_KEY=<oracle_owner_private_key>
  - ORACLE_ADDRESS=<deployed_price_oracle_mock>
  Optional overrides if not available in generated addresses:
  - TOKEN_BTC=0x...
  - TOKEN_ETH=0x...
  - TOKEN_MATIC=0x...
*/

/* eslint-disable no-console */
const path = require('path')
const fs = require('fs')
const { ethers } = require('ethers')
require('dotenv').config()

// Prefer Node18+ global fetch; fallback to node-fetch
async function doFetch(url) {
  if (typeof fetch === 'function') {
    return fetch(url)
  }
  // lazy import for Node < 18
  const nf = await import('node-fetch')
  return nf.default(url)
}

const ORACLE_ARTIFACT = path.join(
  __dirname,
  'artifacts',
  'contracts',
  'PriceOracleMock.sol',
  'PriceOracleMock.json'
)
const oracleAbi = JSON.parse(fs.readFileSync(ORACLE_ARTIFACT, 'utf8')).abi

const RPC_URL = process.env.RPC_URL || process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS

// Optional: read addresses from generated addresses.json if available
function readGeneratedAddresses() {
  try {
    const p = path.join(__dirname, 'app', 'src', 'generated', 'addresses.json')
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'))
    }
  } catch (e) {
    console.warn('! Could not read generated addresses:', e.message)
  }
  return {}
}

const generated = readGeneratedAddresses()

function resolveTokenAddresses() {
  // Try a few likely keys from the app’s address registry
  const candidates = {
    BTC: [
      process.env.TOKEN_BTC,
      generated.mBTC,
      generated.BTC,
      generated.WBTC,
      generated.wBTC,
    ],
    ETH: [
      process.env.TOKEN_ETH,
      generated.WETH,
      generated.ETH,
      generated.mETH,
    ],
    MATIC: [
      process.env.TOKEN_MATIC,
      generated.MATIC,
      generated.WMATIC,
      generated.wMATIC,
    ],
  }

  const pick = (arr) => arr && arr.find((a) => typeof a === 'string' && a.startsWith('0x') && a.length === 42)
  return {
    BTC: pick(candidates.BTC),
    ETH: pick(candidates.ETH),
    MATIC: pick(candidates.MATIC),
  }
}

const TOKEN_ADDRESSES = resolveTokenAddresses()

if (!PRIVATE_KEY || !ORACLE_ADDRESS) {
  console.error('❌ Missing env PRIVATE_KEY or ORACLE_ADDRESS in .env')
  process.exit(1)
}

const provider = new ethers.JsonRpcProvider(RPC_URL)
const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
const oracle = new ethers.Contract(ORACLE_ADDRESS, oracleAbi, wallet)

async function updatePrices() {
  try {
    const res = await doFetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,matic-network&vs_currencies=usd'
    )
    const data = await res.json()

    // Defensive parsing in case of rate limits or structure changes
    const btcUsd = data?.bitcoin?.usd
    const ethUsd = data?.ethereum?.usd
    const maticUsd = data?.['matic-network']?.usd

    if (btcUsd == null && ethUsd == null && maticUsd == null) {
      throw new Error('CoinGecko response missing prices')
    }

    const btc = btcUsd != null ? Math.floor(btcUsd * 1e8) : undefined
    const eth = ethUsd != null ? Math.floor(ethUsd * 1e8) : undefined
    const matic = maticUsd != null ? Math.floor(maticUsd * 1e8) : undefined

    const tokens = []
    const prices = []
    if (TOKEN_ADDRESSES.BTC && btc !== undefined) { tokens.push(TOKEN_ADDRESSES.BTC); prices.push(btc) }
    if (TOKEN_ADDRESSES.ETH && eth !== undefined) { tokens.push(TOKEN_ADDRESSES.ETH); prices.push(eth) }
    if (TOKEN_ADDRESSES.MATIC && matic !== undefined) { tokens.push(TOKEN_ADDRESSES.MATIC); prices.push(matic) }

    if (tokens.length === 0) {
      console.warn('! No token addresses resolved (BTC/ETH/MATIC). Set TOKEN_* env or add to generated addresses.')
      return
    }

    const tx = await oracle.setPrices(tokens, prices)
    await tx.wait()

    console.log(`✅ Prices updated (Tx: ${tx.hash})`)
    if (TOKEN_ADDRESSES.BTC && btcUsd != null) console.log(`BTC: $${btcUsd}`)
    if (TOKEN_ADDRESSES.ETH && ethUsd != null) console.log(`ETH: $${ethUsd}`)
    if (TOKEN_ADDRESSES.MATIC && maticUsd != null) console.log(`MATIC: $${maticUsd}`)
  } catch (err) {
    console.error('❌ Error updating prices:', err.message || err)
  }
}

updatePrices()
setInterval(updatePrices, 60 * 1000)


