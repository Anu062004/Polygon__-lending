#!/bin/bash

# Aave-style Lending Protocol Demo Script
# This script demonstrates the complete lending protocol functionality

set -e

echo "🚀 Starting Aave-style Lending Protocol Demo"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LENDER_ADDRESS="0x096faDC42659Bd065F698C962b3ac0953F1dACB3"
BORROWER_ADDRESS="0x6b3a924379B9408D8110f10F084ca809863B378A"
LIQUIDATOR_ADDRESS="0x742d35Cc6634C0532925a3b8D4C9db96C4b5d5C5"

# Check if deployment file exists
if [ ! -f "deployments/amoy.json" ]; then
    echo -e "${RED}❌ Deployment file not found. Please run deployment first.${NC}"
    echo "Run: npm run deploy:amoy"
    exit 1
fi

# Load deployment addresses
LENDING_POOL=$(jq -r '.contracts.lendingPool' deployments/amoy.json)
MUSDC=$(jq -r '.contracts.mUSDC' deployments/amoy.json)
MBTC=$(jq -r '.contracts.mBTC' deployments/amoy.json)
ORACLE=$(jq -r '.contracts.oracle' deployments/amoy.json)

echo -e "${BLUE}📋 Demo Configuration:${NC}"
echo "Lending Pool: $LENDING_POOL"
echo "mUSDC: $MUSDC"
echo "mBTC: $MBTC"
echo "Oracle: $ORACLE"
echo "Lender: $LENDER_ADDRESS"
echo "Borrower: $BORROWER_ADDRESS"
echo ""

# Function to execute a transaction and wait for confirmation
execute_tx() {
    local description="$1"
    local tx_hash="$2"
    
    echo -e "${YELLOW}⏳ $description${NC}"
    echo "Transaction: $tx_hash"
    
    # Wait for transaction confirmation
    npx hardhat run --network amoy -c "
        const receipt = await ethers.provider.waitForTransaction('$tx_hash');
        console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
        console.log('Gas used:', receipt.gasUsed.toString());
    "
    echo ""
}

# Function to get balance
get_balance() {
    local token="$1"
    local address="$2"
    local decimals="$3"
    
    npx hardhat run --network amoy -c "
        const token = await ethers.getContractAt('ERC20Mock', '$token');
        const balance = await token.balanceOf('$address');
        console.log('Balance:', ethers.formatUnits(balance, $decimals));
    "
}

# Function to get health factor
get_health_factor() {
    local address="$1"
    
    npx hardhat run --network amoy -c "
        const lendingPool = await ethers.getContractAt('LendingPool', '$LENDING_POOL');
        const hf = await lendingPool.getHealthFactor('$address');
        if (hf == ethers.MaxUint256) {
            console.log('Health Factor: ∞ (No debt)');
        } else {
            console.log('Health Factor:', ethers.formatUnits(hf, 18));
        }
    "
}

echo -e "${GREEN}🎯 Step 1: Initial State${NC}"
echo "Getting initial balances..."
get_balance "$MUSDC" "$LENDER_ADDRESS" 6
get_balance "$MBTC" "$BORROWER_ADDRESS" 8
echo ""

echo -e "${GREEN}🎯 Step 2: Lender deposits 1000 mUSDC${NC}"
DEPOSIT_TX=$(npx hardhat run --network amoy -c "
    const lendingPool = await ethers.getContractAt('LendingPool', '$LENDING_POOL');
    const mUSDC = await ethers.getContractAt('ERC20Mock', '$MUSDC');
    
    const amount = ethers.parseUnits('1000', 6);
    await mUSDC.approve('$LENDING_POOL', amount);
    const tx = await lendingPool.deposit('$MUSDC', amount);
    console.log(tx.hash);
")
execute_tx "Lender deposits 1000 mUSDC" "$DEPOSIT_TX"

echo -e "${GREEN}🎯 Step 3: Borrower deposits 0.02 mBTC as collateral${NC}"
COLLATERAL_TX=$(npx hardhat run --network amoy -c "
    const lendingPool = await ethers.getContractAt('LendingPool', '$LENDING_POOL');
    const mBTC = await ethers.getContractAt('ERC20Mock', '$MBTC');
    
    const amount = ethers.parseUnits('0.02', 8);
    await mBTC.approve('$LENDING_POOL', amount);
    const tx = await lendingPool.deposit('$MBTC', amount);
    console.log(tx.hash);
")
execute_tx "Borrower deposits 0.02 mBTC as collateral" "$COLLATERAL_TX"

echo -e "${GREEN}🎯 Step 4: Borrower borrows 700 mUSDC (75% LTV)${NC}"
BORROW_TX=$(npx hardhat run --network amoy -c "
    const lendingPool = await ethers.getContractAt('LendingPool', '$LENDING_POOL');
    
    const amount = ethers.parseUnits('700', 6);
    const tx = await lendingPool.borrow('$MUSDC', amount);
    console.log(tx.hash);
")
execute_tx "Borrower borrows 700 mUSDC" "$BORROW_TX"

echo -e "${BLUE}📊 Current State After Borrowing:${NC}"
get_balance "$MUSDC" "$BORROWER_ADDRESS" 6
get_balance "$MBTC" "$BORROWER_ADDRESS" 8
get_health_factor "$BORROWER_ADDRESS"
echo ""

echo -e "${GREEN}🎯 Step 5: Advance time by 30 days${NC}"
TIME_TX=$(npx hardhat run --network amoy -c "
    // Advance time by 30 days
    await ethers.provider.send('evm_increaseTime', [30 * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine', []);
    console.log('Time advanced by 30 days');
")
echo "✅ Time advanced by 30 days"
echo ""

echo -e "${GREEN}🎯 Step 6: Trigger interest accrual${NC}"
ACCRUE_TX=$(npx hardhat run --network amoy -c "
    const lendingPool = await ethers.getContractAt('LendingPool', '$LENDING_POOL');
    const mUSDC = await ethers.getContractAt('ERC20Mock', '$MUSDC');
    
    // Make a small deposit to trigger interest accrual
    const amount = ethers.parseUnits('1', 6);
    await mUSDC.approve('$LENDING_POOL', amount);
    const tx = await lendingPool.deposit('$MUSDC', amount);
    console.log(tx.hash);
")
execute_tx "Trigger interest accrual" "$ACCRUE_TX"

echo -e "${BLUE}📊 State After Interest Accrual:${NC}"
get_balance "$MUSDC" "$BORROWER_ADDRESS" 6
get_health_factor "$BORROWER_ADDRESS"
echo ""

echo -e "${GREEN}🎯 Step 7: Lower mBTC price by 30%${NC}"
PRICE_TX=$(npx hardhat run --network amoy -c "
    const oracle = await ethers.getContractAt('PriceOracleMock', '$ORACLE');
    
    // Lower mBTC price from $50,000 to $35,000 (30% drop)
    const newPrice = ethers.parseUnits('35000', 8);
    const tx = await oracle.setPrice('$MBTC', newPrice);
    console.log(tx.hash);
")
execute_tx "Lower mBTC price by 30%" "$PRICE_TX"

echo -e "${BLUE}📊 State After Price Drop:${NC}"
get_health_factor "$BORROWER_ADDRESS"
echo ""

echo -e "${GREEN}🎯 Step 8: Liquidate borrower position${NC}"
LIQUIDATE_TX=$(npx hardhat run --network amoy -c "
    const lendingPool = await ethers.getContractAt('LendingPool', '$LENDING_POOL');
    const mUSDC = await ethers.getContractAt('ERC20Mock', '$MUSDC');
    
    // Liquidate 100 mUSDC of debt
    const debtAmount = ethers.parseUnits('100', 6);
    await mUSDC.approve('$LENDING_POOL', debtAmount);
    const tx = await lendingPool.liquidate(
        '$MBTC',    // collateral asset
        '$MUSDC',   // debt asset
        '$BORROWER_ADDRESS', // borrower
        debtAmount  // debt amount to repay
    );
    console.log(tx.hash);
")
execute_tx "Liquidate borrower position" "$LIQUIDATE_TX"

echo -e "${BLUE}📊 Final State After Liquidation:${NC}"
get_balance "$MUSDC" "$BORROWER_ADDRESS" 6
get_balance "$MBTC" "$BORROWER_ADDRESS" 8
get_balance "$MUSDC" "$LIQUIDATOR_ADDRESS" 6
get_balance "$MBTC" "$LIQUIDATOR_ADDRESS" 8
get_health_factor "$BORROWER_ADDRESS"
echo ""

echo -e "${GREEN}🎉 Demo completed successfully!${NC}"
echo "=============================================="
echo -e "${BLUE}📋 Summary:${NC}"
echo "1. ✅ Lender deposited 1000 mUSDC"
echo "2. ✅ Borrower deposited 0.02 mBTC as collateral"
echo "3. ✅ Borrower borrowed 700 mUSDC (75% LTV)"
echo "4. ✅ Time advanced by 30 days"
echo "5. ✅ Interest accrued on positions"
echo "6. ✅ mBTC price dropped by 30%"
echo "7. ✅ Borrower position was liquidated"
echo ""
echo -e "${YELLOW}🔗 Explorer Links:${NC}"
echo "Lending Pool: https://amoy.polygonscan.com/address/$LENDING_POOL"
echo "mUSDC: https://amoy.polygonscan.com/address/$MUSDC"
echo "mBTC: https://amoy.polygonscan.com/address/$MBTC"
echo "Oracle: https://amoy.polygonscan.com/address/$ORACLE"
echo ""
echo -e "${GREEN}🚀 Next Steps:${NC}"
echo "1. Start the frontend: cd app && npm run dev"
echo "2. Connect your wallet to Polygon Amoy testnet"
echo "3. Test the lending protocol functionality"
echo "4. Check the frontend for real-time updates"



