/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

function readDeployment() {
  const root = path.join(__dirname, '..')
  const candidates = [
    path.join(root, 'deployments', 'amoy.json'),
    path.join(root, 'deployments', 'hardhat.json'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const json = JSON.parse(fs.readFileSync(p, 'utf8'))
      return json.contracts || {}
    }
  }
  return null
}

function main() {
  const contracts = readDeployment()
  const outDir = path.join(__dirname, '..', 'app', 'src', 'generated')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const outFile = path.join(outDir, 'addresses.json')

  let data
  if (contracts) {
    data = {
      lendingPool: contracts.lendingPool || '0x0000000000000000000000000000000000000000',
      mUSDC: contracts.mUSDC || '0x0000000000000000000000000000000000000000',
      mBTC: contracts.mBTC || '0x0000000000000000000000000000000000000000',
      oracle: contracts.oracle || '0x0000000000000000000000000000000000000000',
      aUSDC: contracts.aUSDC || '0x0000000000000000000000000000000000000000',
      aBTC: contracts.aBTC || '0x0000000000000000000000000000000000000000',
      debtUSDC: contracts.debtUSDC || '0x0000000000000000000000000000000000000000',
      debtBTC: contracts.debtBTC || '0x0000000000000000000000000000000000000000',
    }
    console.log('✓ Synced addresses from deployments to app/src/generated/addresses.json')
  } else {
    data = {
      lendingPool: '0x0000000000000000000000000000000000000000',
      mUSDC: '0x0000000000000000000000000000000000000000',
      mBTC: '0x0000000000000000000000000000000000000000',
      oracle: '0x0000000000000000000000000000000000000000',
      aUSDC: '0x0000000000000000000000000000000000000000',
      aBTC: '0x0000000000000000000000000000000000000000',
      debtUSDC: '0x0000000000000000000000000000000000000000',
      debtBTC: '0x0000000000000000000000000000000000000000',
    }
    console.warn('! No deployments found; wrote placeholder addresses to app/src/generated/addresses.json')
  }
  fs.writeFileSync(outFile, JSON.stringify(data, null, 2))
}

main()


