# Aave-style Lending Protocol on Polygon Amoy

A comprehensive decentralized lending protocol implementation inspired by Aave, deployed on Polygon Amoy testnet. This project demonstrates all core DeFi lending functionality including deposits, withdrawals, borrowing, repaying, and liquidations.

## 🎯 Project Overview

This is a full-stack DeFi lending protocol that replicates Aave's core functionality with:

- **Smart Contracts**: Complete lending pool implementation with interest accrual
- **Frontend**: Modern React dApp with wallet integration
- **Testing**: Comprehensive test suite with 80%+ coverage
- **Deployment**: Automated deployment to Polygon Amoy testnet
- **Demo**: Automated demo script showcasing all features

## 🏗️ Architecture

### Smart Contracts
- **LendingPool**: Core lending logic with deposit/withdraw/borrow/repay/liquidate
- **AToken**: Interest-bearing tokens for suppliers
- **DebtToken**: Debt tracking tokens for borrowers
- **PriceOracleMock**: Price feeds for assets (mUSDC, mBTC)
- **InterestRateModelAaveStyle**: Aave-style 2-slope interest model
- **PoolConfigurator**: Risk parameter management
- **ERC20Mock**: Mock tokens for testing

### Frontend
- **React + Vite**: Modern frontend framework
- **Wagmi + RainbowKit**: Wallet connectivity
- **Tailwind CSS**: Styling and responsive design
- **Real-time Updates**: Live portfolio and market data

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet
- Polygon Amoy testnet MATIC

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd aave-style-lending-protocol
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Add your private key and WalletConnect project ID
```

4. **Deploy contracts to Polygon Amoy**
```bash
npm run deploy:amoy
```

5. **Start the frontend**
```bash
cd app
npm install
npm run dev
```

6. **Run the demo**
```bash
npm run demo
```

## 📋 Features

### Core Lending Functions
- ✅ **Deposit**: Supply assets to earn interest
- ✅ **Withdraw**: Remove supplied assets
- ✅ **Borrow**: Borrow against collateral
- ✅ **Repay**: Repay borrowed assets
- ✅ **Liquidate**: Liquidate undercollateralized positions

### Advanced Features
- ✅ **Interest Accrual**: Dynamic interest rates based on utilization
- ✅ **Health Factor**: Real-time position monitoring
- ✅ **Risk Management**: Configurable LTV, liquidation thresholds
- ✅ **Oracle Integration**: Price feeds for asset valuation
- ✅ **Emergency Controls**: Pause/unpause functionality

### Frontend Features
- ✅ **Wallet Integration**: MetaMask, WalletConnect support
- ✅ **Portfolio Dashboard**: Real-time position tracking
- ✅ **Supply/Borrow Interface**: Intuitive lending operations
- ✅ **Liquidation Panel**: Liquidator interface
- ✅ **Test Faucet**: Get test tokens for testing
- ✅ **Responsive Design**: Mobile-friendly interface

## 🔧 Configuration

### Risk Parameters
- **LTV**: 75% (Loan-to-Value ratio)
- **Liquidation Threshold**: 80%
- **Liquidation Bonus**: 5%
- **Reserve Factor**: 10%

### Interest Rate Model
- **Base Rate**: 0%
- **Slope1**: 4% APR (up to 80% utilization)
- **Slope2**: 75% APR (above 80% utilization)
- **Optimal Utilization**: 80%

### Supported Assets
- **mUSDC**: Mock USD Coin (6 decimals, $1 price)
- **mBTC**: Mock Bitcoin (8 decimals, $50,000 price)

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx hardhat test test/LendingPool.test.js
```

### Test Coverage
The test suite covers:
- Contract deployment and configuration
- Deposit/withdraw functionality
- Borrow/repay operations
- Interest accrual over time
- Health factor calculations
- Liquidation scenarios
- Edge cases and error conditions

## 🚀 Deployment

### Polygon Amoy Testnet
```bash
# Deploy all contracts
npm run deploy:amoy

# Verify contracts on explorer
npx hardhat verify --network amoy <CONTRACT_ADDRESS>
```

### Deployment Output
All deployment information is saved to `deployments/amoy.json`:
- Contract addresses
- Transaction hashes
- Deployment timestamp
- Network configuration

## 🎮 Demo

### Automated Demo
```bash
# Run the complete demo
npm run demo
```

The demo showcases:
1. Lender deposits 1000 mUSDC
2. Borrower deposits 0.02 mBTC as collateral
3. Borrower borrows 700 mUSDC (75% LTV)
4. Time advancement (30 days)
5. Interest accrual demonstration
6. Price drop simulation (30%)
7. Liquidation execution

### Manual Testing
1. Connect wallet to Polygon Amoy testnet
2. Get test tokens from the faucet
3. Supply assets to earn interest
4. Use collateral to borrow other assets
5. Monitor health factor
6. Test liquidation scenarios

## 📊 Frontend Usage

### Dashboard
- **Portfolio Overview**: Total supplied, borrowed, net worth, health factor
- **Supply Section**: Deposit/withdraw assets
- **Borrow Section**: Borrow/repay assets
- **Liquidation Panel**: Liquidate undercollateralized positions
- **Faucet**: Get test tokens

### Wallet Integration
- Supports MetaMask, WalletConnect, and other wallets
- Automatic network switching to Polygon Amoy
- Real-time balance updates
- Transaction status tracking

## 🔒 Security

### Security Features
- **ReentrancyGuard**: Prevents reentrancy attacks
- **SafeERC20**: Safe token transfers
- **Ownable**: Access control
- **Input Validation**: Comprehensive parameter checks
- **Emergency Pause**: Circuit breaker functionality

### Audit Considerations
- This is a demo implementation for educational purposes
- Not audited for production use
- Oracle prices are manually set (not from real feeds)
- Additional security measures needed for mainnet deployment

## 📚 Documentation

### Smart Contract Documentation
- All contracts include comprehensive NatSpec documentation
- Function parameters and return values documented
- Event emissions documented
- Security considerations noted

### API Documentation
- Contract interfaces documented
- Frontend hooks and utilities documented
- Deployment scripts documented

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Style
- Use Solidity 0.8.21+
- Follow OpenZeppelin patterns
- Include comprehensive tests
- Document all public functions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This is a demonstration project for educational purposes. It is not audited and should not be used in production without proper security audits and additional testing.

## 🔗 Links

- [Polygon Amoy Explorer](https://amoy.polygonscan.com/)
- [Polygon Documentation](https://docs.polygon.technology/)
- [Aave Protocol](https://aave.com/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Wagmi Documentation](https://wagmi.sh/)

## 📞 Support

For questions or issues:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed description
4. Include reproduction steps and error messages

---

**Built with ❤️ for the DeFi community**