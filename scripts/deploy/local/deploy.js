const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting Debpol Protocol deployment to local Hardhat network...");
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
    
    // Deployment configuration
    const deploymentConfig = {
        network: "localhost",
        chainId: 1337,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {}
    };
    
    try {
        // 1. Deploy Mock Tokens
        console.log("\n📦 Deploying Mock Tokens...");
        
        const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
        
        // Deploy mUSDC
        const mUSDC = await ERC20Mock.deploy(
            "Mock USD Coin",
            "mUSDC",
            6, // 6 decimals
            deployer.address // Initial owner
        );
        await mUSDC.waitForDeployment();
        console.log("✅ mUSDC deployed to:", await mUSDC.getAddress());
        deploymentConfig.contracts.mUSDC = await mUSDC.getAddress();
        
        // Deploy mBTC
        const mBTC = await ERC20Mock.deploy(
            "Mock Bitcoin",
            "mBTC",
            8, // 8 decimals
            deployer.address // Initial owner
        );
        await mBTC.waitForDeployment();
        console.log("✅ mBTC deployed to:", await mBTC.getAddress());
        deploymentConfig.contracts.mBTC = await mBTC.getAddress();
        
        // 2. Deploy Price Oracle
        console.log("\n🔮 Deploying Price Oracle...");
        
        const PriceOracleMock = await ethers.getContractFactory("PriceOracleMock");
        const oracle = await PriceOracleMock.deploy(deployer.address);
        await oracle.waitForDeployment();
        console.log("✅ PriceOracleMock deployed to:", await oracle.getAddress());
        deploymentConfig.contracts.PriceOracleMock = await oracle.getAddress();
        
        // Set initial prices
        await oracle.setPrice(await mUSDC.getAddress(), ethers.parseUnits("1", 8)); // $1
        await oracle.setPrice(await mBTC.getAddress(), ethers.parseUnits("50000", 8)); // $50,000
        console.log("✅ Initial prices set");
        
        // 3. Deploy Oracle Aggregator
        console.log("\n🔗 Deploying Oracle Aggregator...");
        
        const OracleAggregator = await ethers.getContractFactory("OracleAggregator");
        const oracleAggregator = await OracleAggregator.deploy(deployer.address);
        await oracleAggregator.waitForDeployment();
        console.log("✅ OracleAggregator deployed to:", await oracleAggregator.getAddress());
        deploymentConfig.contracts.OracleAggregator = await oracleAggregator.getAddress();
        
        // Add mock oracle to aggregator
        await oracleAggregator.addOracle(await mUSDC.getAddress(), await oracle.getAddress(), 10000); // 100% weight
        await oracleAggregator.addOracle(await mBTC.getAddress(), await oracle.getAddress(), 10000); // 100% weight
        console.log("✅ Mock oracle added to aggregator");
        
        // 4. Deploy Interest Rate Model
        console.log("\n📊 Deploying Interest Rate Model...");
        
        const InterestRateModelAaveStyle = await ethers.getContractFactory("InterestRateModelAaveStyle");
        const interestRateModel = await InterestRateModelAaveStyle.deploy();
        await interestRateModel.waitForDeployment();
        console.log("✅ InterestRateModelAaveStyle deployed to:", await interestRateModel.getAddress());
        deploymentConfig.contracts.InterestRateModelAaveStyle = await interestRateModel.getAddress();
        
        // 5. Deploy Pool Configurator
        console.log("\n⚙️  Deploying Pool Configurator...");
        
        const PoolConfigurator = await ethers.getContractFactory("PoolConfigurator");
        const configurator = await PoolConfigurator.deploy(deployer.address);
        await configurator.waitForDeployment();
        console.log("✅ PoolConfigurator deployed to:", await configurator.getAddress());
        deploymentConfig.contracts.PoolConfigurator = await configurator.getAddress();
        
        // 6. Deploy Lending Pool
        console.log("\n🏦 Deploying Lending Pool...");
        
        const LendingPool = await ethers.getContractFactory("LendingPool");
        const lendingPool = await LendingPool.deploy(
            await oracle.getAddress(),
            await interestRateModel.getAddress(),
            await configurator.getAddress(),
            deployer.address
        );
        await lendingPool.waitForDeployment();
        console.log("✅ LendingPool deployed to:", await lendingPool.getAddress());
        deploymentConfig.contracts.LendingPool = await lendingPool.getAddress();
        
        // 7. Deploy ATokens
        console.log("\n🎫 Deploying ATokens...");
        
        const AToken = await ethers.getContractFactory("AToken");
        
        // Deploy amUSDC
        const amUSDC = await AToken.deploy(
            "Aave mUSDC",
            "amUSDC",
            await mUSDC.getAddress(),
            await lendingPool.getAddress()
        );
        await amUSDC.waitForDeployment();
        console.log("✅ amUSDC deployed to:", await amUSDC.getAddress());
        deploymentConfig.contracts.amUSDC = await amUSDC.getAddress();
        
        // Deploy amBTC
        const amBTC = await AToken.deploy(
            "Aave mBTC",
            "amBTC",
            await mBTC.getAddress(),
            await lendingPool.getAddress()
        );
        await amBTC.waitForDeployment();
        console.log("✅ amBTC deployed to:", await amBTC.getAddress());
        deploymentConfig.contracts.amBTC = await amBTC.getAddress();
        
        // 8. Deploy Debt Tokens
        console.log("\n💳 Deploying Debt Tokens...");
        
        const DebtToken = await ethers.getContractFactory("DebtToken");
        
        // Deploy debtmUSDC
        const debtmUSDC = await DebtToken.deploy(
            "Debt mUSDC",
            "debtmUSDC",
            await mUSDC.getAddress(),
            await lendingPool.getAddress()
        );
        await debtmUSDC.waitForDeployment();
        console.log("✅ debtmUSDC deployed to:", await debtmUSDC.getAddress());
        deploymentConfig.contracts.debtmUSDC = await debtmUSDC.getAddress();
        
        // Deploy debtmBTC
        const debtmBTC = await DebtToken.deploy(
            "Debt mBTC",
            "debtmBTC",
            await mBTC.getAddress(),
            await lendingPool.getAddress()
        );
        await debtmBTC.waitForDeployment();
        console.log("✅ debtmBTC deployed to:", await debtmBTC.getAddress());
        deploymentConfig.contracts.debtmBTC = await debtmBTC.getAddress();
        
        // 9. Configure Lending Pool
        console.log("\n🔧 Configuring Lending Pool...");
        
        // Set aTokens
        await lendingPool.setAToken(await mUSDC.getAddress(), await amUSDC.getAddress());
        await lendingPool.setAToken(await mBTC.getAddress(), await amBTC.getAddress());
        
        // Set debt tokens
        await lendingPool.setDebtToken(await mUSDC.getAddress(), await debtmUSDC.getAddress());
        await lendingPool.setDebtToken(await mBTC.getAddress(), await debtmBTC.getAddress());
        
        console.log("✅ Lending pool configured");
        
        // 10. Deploy Debpol Protocol Features
        console.log("\n🌟 Deploying Debpol Protocol Features...");
        
        // Deploy Flash Loan Provider
        const FlashLoanProvider = await ethers.getContractFactory("FlashLoanProvider");
        const flashLoanProvider = await FlashLoanProvider.deploy(
            await lendingPool.getAddress(),
            deployer.address
        );
        await flashLoanProvider.waitForDeployment();
        console.log("✅ FlashLoanProvider deployed to:", await flashLoanProvider.getAddress());
        deploymentConfig.contracts.FlashLoanProvider = await flashLoanProvider.getAddress();
        
        // Deploy Governance Token
        const DebpolToken = await ethers.getContractFactory("DebpolToken");
        // Create different addresses for treasury and reserve
        const treasuryAddress = ethers.Wallet.createRandom().address;
        const reserveAddress = ethers.Wallet.createRandom().address;
        const debpolToken = await DebpolToken.deploy(
            treasuryAddress, // Treasury
            reserveAddress,   // Reserve
            deployer.address  // Owner
        );
        await debpolToken.waitForDeployment();
        console.log("✅ DebpolToken deployed to:", await debpolToken.getAddress());
        deploymentConfig.contracts.DebpolToken = await debpolToken.getAddress();
        
        // Deploy Reward Distributor
        const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
        const rewardDistributor = await RewardDistributor.deploy(
            await lendingPool.getAddress(),
            await debpolToken.getAddress(),
            deployer.address
        );
        await rewardDistributor.waitForDeployment();
        console.log("✅ RewardDistributor deployed to:", await rewardDistributor.getAddress());
        deploymentConfig.contracts.RewardDistributor = await rewardDistributor.getAddress();
        
        // 11. Configure Pool Configurator
        console.log("\n⚙️  Configuring Pool Configurator...");
        
        // Configure mUSDC
        await configurator.setAssetConfig(
            await mUSDC.getAddress(),
            7500, // LTV 75%
            8000, // Liquidation threshold 80%
            10500, // Liquidation bonus 5%
            1000, // Reserve factor 10%
            true // Active
        );
        
        // Configure mBTC
        await configurator.setAssetConfig(
            await mBTC.getAddress(),
            7500, // LTV 75%
            8000, // Liquidation threshold 80%
            10500, // Liquidation bonus 5%
            1000, // Reserve factor 10%
            true // Active
        );
        
        console.log("✅ Pool configurator configured");
        
        // 12. Save deployment information
        console.log("\n💾 Saving deployment information...");
        
        const deploymentPath = path.join(__dirname, "../../deployments/local.json");
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentConfig, null, 2));
        console.log("✅ Deployment info saved to:", deploymentPath);
        
        // 13. Create deployment config for frontend
        const frontendConfig = {
            network: "localhost",
            chainId: 1337,
            contracts: {
                LendingPool: await lendingPool.getAddress(),
                FlashLoanProvider: await flashLoanProvider.getAddress(),
                DebpolToken: await debpolToken.getAddress(),
                RewardDistributor: await rewardDistributor.getAddress(),
                OracleAggregator: await oracleAggregator.getAddress(),
                mUSDC: await mUSDC.getAddress(),
                mBTC: await mBTC.getAddress(),
                amUSDC: await amUSDC.getAddress(),
                amBTC: await amBTC.getAddress(),
                debtmUSDC: await debtmUSDC.getAddress(),
                debtmBTC: await debtmBTC.getAddress()
            }
        };
        
        const frontendConfigPath = path.join(__dirname, "../../deploy-config/local.json");
        fs.writeFileSync(frontendConfigPath, JSON.stringify(frontendConfig, null, 2));
        console.log("✅ Frontend config saved to:", frontendConfigPath);
        
        // 14. Display deployment summary
        console.log("\n🎉 Deployment Summary:");
        console.log("=====================================");
        console.log("Network: Local Hardhat (Chain ID: 1337)");
        console.log("Deployer:", deployer.address);
        console.log("Timestamp:", deploymentConfig.timestamp);
        console.log("\n📋 Contract Addresses:");
        console.log("LendingPool:", await lendingPool.getAddress());
        console.log("FlashLoanProvider:", await flashLoanProvider.getAddress());
        console.log("DebpolToken:", await debpolToken.getAddress());
        console.log("RewardDistributor:", await rewardDistributor.getAddress());
        console.log("OracleAggregator:", await oracleAggregator.getAddress());
        console.log("mUSDC:", await mUSDC.getAddress());
        console.log("mBTC:", await mBTC.getAddress());
        
        console.log("\n✅ Local deployment completed successfully!");
        console.log("🔗 Frontend should connect to: http://localhost:8545");
        
    } catch (error) {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
