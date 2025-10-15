# Aave-style Lending Protocol Demo

This document provides a comprehensive guide to the Aave-style lending protocol demo on Polygon Amoy testnet.

## 🎯 Demo Overview

The demo showcases a complete DeFi lending protocol with the following features:
- **Deposit/Withdraw**: Users can supply assets to earn interest
- **Borrow/Repay**: Users can borrow against their collateral
- **Interest Accrual**: Dynamic interest rates based on utilization
- **Liquidation**: Automatic liquidation of undercollateralized positions
- **Health Factor**: Real-time monitoring of position safety

## 🏗️ Architecture

### Smart Contracts
- **LendingPool**: Core lending logic
- **AToken**: Interest-bearing tokens for suppliers
- **DebtToken**: Debt tracking tokens for borrowers
- **PriceOracleMock**: Price feeds for assets
- **InterestRateModelAaveStyle**: Aave-style 2-slope interest model
- **PoolConfigurator**: Risk parameter management
- **ERC20Mock**: Mock tokens (mUSDC, mBTC)

### Key Parameters
- **LTV**: 75% (Loan-to-Value ratio)
- **Liquidation Threshold**: 80%
- **Liquidation Bonus**: 5%
- **Reserve Factor**: 10%
- **Base Rate**: 0%
- **Slope1**: 4% APR
- **Slope2**: 75% APR
- **Optimal Utilization**: 80%

## 🚀 Demo Steps

### 1. Initial State
- **Lender**: 500,000 mUSDC
- **Borrower**: 5 mBTC
- **Oracle Prices**: mUSDC = $1, mBTC = $50,000

### 2. Lender Deposits 1000 mUSDC
```bash
# Transaction: Lender deposits 1000 mUSDC
# Result: Lender receives 1000 amUSDC tokens
# Pool TVL: 1000 mUSDC
```

### 3. Borrower Deposits 0.02 mBTC as Collateral
```bash
# Transaction: Borrower deposits 0.02 mBTC
# Result: Borrower receives 0.02 amBTC tokens
# Collateral Value: $1,000 (0.02 * $50,000)
```

### 4. Borrower Borrows 700 mUSDC
```bash
# Transaction: Borrower borrows 700 mUSDC
# Result: Borrower receives 700 mUSDC, 700 debtmUSDC tokens
# Health Factor: ~1.14 (Safe)
# Utilization: 70%
```

### 5. Time Advancement (30 Days)
```bash
# Simulate 30 days of interest accrual
# Interest compounds on both supply and borrow positions
```

### 6. Interest Accrual
```bash
# Trigger interest accrual with small deposit
# Result: Borrower debt increases, lender balance increases
# Health Factor: Slightly lower due to increased debt
```

### 7. Price Drop Simulation
```bash
# Lower mBTC price from $50,000 to $35,000 (30% drop)
# Result: Collateral value drops to $700
# Health Factor: Drops below 1.0 (Liquidatable)
```

### 8. Liquidation
```bash
# Liquidator repays 100 mUSDC of borrower's debt
# Result: Liquidator receives mBTC collateral + 5% bonus
# Borrower's position is partially liquidated
```

## 📊 Expected Results

### After Step 4 (Borrowing)
- **Lender Balance**: 499,000 mUSDC + 1000 amUSDC
- **Borrower Balance**: 700 mUSDC + 0.02 amBTC
- **Pool TVL**: 1000 mUSDC + 0.02 mBTC
- **Total Borrowed**: 700 mUSDC
- **Utilization**: 70%
- **Health Factor**: ~1.14

### After Step 6 (Interest Accrual)
- **Borrower Debt**: ~700.58 mUSDC (increased due to interest)
- **Lender Balance**: ~1000.12 amUSDC (increased due to interest)
- **Health Factor**: ~1.13 (slightly lower)

### After Step 7 (Price Drop)
- **Collateral Value**: $700 (0.02 * $35,000)
- **Debt Value**: ~$700.58
- **Health Factor**: ~0.998 (Liquidatable)

### After Step 8 (Liquidation)
- **Liquidator**: Receives ~0.003 mBTC (100 mUSDC debt + 5% bonus)
- **Borrower**: Debt reduced by 100 mUSDC
- **Health Factor**: Improved but still liquidatable

## 🔧 Running the Demo

### Prerequisites
1. Deploy contracts to Polygon Amoy testnet
2. Ensure test accounts have sufficient MATIC for gas
3. Have deployment addresses in `deployments/amoy.json`

### Execute Demo
```bash
# Make script executable
chmod +x demo.sh

# Run the demo
./demo.sh
```

### Manual Demo Steps
If you prefer to run steps manually:

```bash
# 1. Deploy contracts
npm run deploy:amoy

# 2. Run individual transactions
npx hardhat run scripts/demo-steps.js --network amoy

# 3. Check balances and health factors
npx hardhat run scripts/check-state.js --network amoy
```

## 📈 Interest Rate Model

The protocol uses an Aave-style 2-slope interest rate model:

### Borrow Rate Calculation
```
if utilization ≤ 80%:
    borrowRate = 0% + (utilization / 80%) * 4%
else:
    borrowRate = 0% + 4% + ((utilization - 80%) / 20%) * 75%
```

### Supply Rate Calculation
```
supplyRate = borrowRate * utilization * (1 - 10%)
```

### Example at 70% Utilization
- **Borrow Rate**: 3.5% APR
- **Supply Rate**: 2.205% APR (3.5% * 70% * 90%)

## 🛡️ Risk Management

### Health Factor Formula
```
Health Factor = (Collateral Value * Liquidation Threshold) / Total Debt Value
```

### Liquidation Conditions
- Health Factor < 1.0
- Liquidator can repay up to 50% of debt
- Liquidator receives collateral + 5% bonus

### Risk Parameters
- **LTV**: Maximum borrowing power (75%)
- **Liquidation Threshold**: When liquidation becomes possible (80%)
- **Liquidation Bonus**: Incentive for liquidators (5%)

## 🔗 Explorer Links

After deployment, you can view transactions on:
- **Polygon Amoy Explorer**: https://amoy.polygonscan.com/
- **Contract Addresses**: Stored in `deployments/amoy.json`

## 🚀 Next Steps

1. **Frontend Integration**: Connect the React frontend to deployed contracts
2. **Real-time Updates**: Implement WebSocket connections for live data
3. **Advanced Features**: Add flash loans, governance, and more assets
4. **Security Audit**: Conduct professional security audit
5. **Mainnet Deployment**: Deploy to Polygon mainnet after testing

## 📝 Notes

- This is a demo implementation for educational purposes
- Oracle prices are manually set (not from real feeds)
- Interest accrual is simplified for demonstration
- Real-world implementation would require additional security measures
- Always test thoroughly before mainnet deployment

## 🐛 Troubleshooting

### Common Issues
1. **Insufficient Gas**: Ensure accounts have enough MATIC
2. **Network Issues**: Check Polygon Amoy RPC connectivity
3. **Contract Errors**: Verify deployment addresses are correct
4. **Transaction Failures**: Check health factors and collateral ratios

### Debug Commands
```bash
# Check contract state
npx hardhat run scripts/debug.js --network amoy

# Verify deployment
npx hardhat verify --network amoy <CONTRACT_ADDRESS>

# Check balances
npx hardhat run scripts/check-balances.js --network amoy
```

## 📚 References

- [Aave Protocol Documentation](https://docs.aave.com/)
- [Polygon Documentation](https://docs.polygon.technology/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)



