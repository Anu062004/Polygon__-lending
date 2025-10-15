const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Configuration
const LENDER_ADDRESS = "0x096faDC42659Bd065F698C962b3ac0953F1dACB3";
const BORROWER_ADDRESS = "0x6b3a924379B9408D8110f10F084ca809863B378A";

// Oracle prices (8 decimals)
const ORACLE_PRICES = {
  mUSDC: ethers.parseUnits("1", 8), // 1 USD
  mBTC: ethers.parseUnits("50000", 8), // 50,000 USD
};

// Risk parameters (in basis points)
const RISK_PARAMS = {
  ltv: 7500, // 75%
  liquidationThreshold: 8000, // 80%
  liquidationBonus: 10500, // 105% (5% bonus)
  reserveFactor: 1000, // 10%
};

// Token amounts for testing
const TEST_AMOUNTS = {
  mUSDC: ethers.parseUnits("500000", 6), // 500,000 mUSDC
  mBTC: ethers.parseUnits("5", 8), // 5 mBTC
};

async function main() {
  console.log("🚀 Starting deployment to Polygon Amoy testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC\n");

  const deploymentData = {
    network: "polygon-amoy",
    chainId: 80002,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {},
    transactions: {},
  };

  try {
    // 1. Deploy Mock Tokens
    console.log("📝 Deploying Mock Tokens...");
    
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    
    // Deploy mUSDC
    const mUSDC = await ERC20Mock.deploy(
      "Mock USD Coin",
      "mUSDC",
      6,
      deployer.address
    );
    await mUSDC.waitForDeployment();
    const mUSDCAddress = await mUSDC.getAddress();
    console.log("✅ mUSDC deployed to:", mUSDCAddress);
    
    // Deploy mBTC
    const mBTC = await ERC20Mock.deploy(
      "Mock Bitcoin",
      "mBTC",
      8,
      deployer.address
    );
    await mBTC.waitForDeployment();
    const mBTCAddress = await mBTC.getAddress();
    console.log("✅ mBTC deployed to:", mBTCAddress);

    deploymentData.contracts.mUSDC = mUSDCAddress;
    deploymentData.contracts.mBTC = mBTCAddress;
    deploymentData.transactions.mUSDC = mUSDC.deploymentTransaction().hash;
    deploymentData.transactions.mBTC = mBTC.deploymentTransaction().hash;

    // 2. Deploy Price Oracle
    console.log("\n📊 Deploying Price Oracle...");
    
    const PriceOracleMock = await ethers.getContractFactory("PriceOracleMock");
    const oracle = await PriceOracleMock.deploy(deployer.address);
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    console.log("✅ Price Oracle deployed to:", oracleAddress);

    // Set initial prices
    await oracle.setPrices([mUSDCAddress, mBTCAddress], [ORACLE_PRICES.mUSDC, ORACLE_PRICES.mBTC]);
    console.log("✅ Oracle prices set: mUSDC = $1, mBTC = $50,000");

    deploymentData.contracts.oracle = oracleAddress;
    deploymentData.transactions.oracle = oracle.deploymentTransaction().hash;

    // 3. Deploy Interest Rate Model
    console.log("\n📈 Deploying Interest Rate Model...");
    
    const InterestRateModelAaveStyle = await ethers.getContractFactory("InterestRateModelAaveStyle");
    const interestRateModel = await InterestRateModelAaveStyle.deploy();
    await interestRateModel.waitForDeployment();
    const interestRateModelAddress = await interestRateModel.getAddress();
    console.log("✅ Interest Rate Model deployed to:", interestRateModelAddress);

    deploymentData.contracts.interestRateModel = interestRateModelAddress;
    deploymentData.transactions.interestRateModel = interestRateModel.deploymentTransaction().hash;

    // 4. Deploy Pool Configurator
    console.log("\n⚙️ Deploying Pool Configurator...");
    
    const PoolConfigurator = await ethers.getContractFactory("PoolConfigurator");
    const configurator = await PoolConfigurator.deploy(deployer.address);
    await configurator.waitForDeployment();
    const configuratorAddress = await configurator.getAddress();
    console.log("✅ Pool Configurator deployed to:", configuratorAddress);

    // Configure assets
    await configurator.setAssetConfig(
      mUSDCAddress,
      RISK_PARAMS.ltv,
      RISK_PARAMS.liquidationThreshold,
      RISK_PARAMS.liquidationBonus,
      RISK_PARAMS.reserveFactor,
      true
    );
    
    await configurator.setAssetConfig(
      mBTCAddress,
      RISK_PARAMS.ltv,
      RISK_PARAMS.liquidationThreshold,
      RISK_PARAMS.liquidationBonus,
      RISK_PARAMS.reserveFactor,
      true
    );
    console.log("✅ Asset configurations set");

    deploymentData.contracts.configurator = configuratorAddress;
    deploymentData.transactions.configurator = configurator.deploymentTransaction().hash;

    // 5. Deploy Lending Pool
    console.log("\n🏦 Deploying Lending Pool...");
    
    const LendingPool = await ethers.getContractFactory("LendingPool");
    const lendingPool = await LendingPool.deploy(
      oracleAddress,
      interestRateModelAddress,
      configuratorAddress,
      deployer.address
    );
    await lendingPool.waitForDeployment();
    const lendingPoolAddress = await lendingPool.getAddress();
    console.log("✅ Lending Pool deployed to:", lendingPoolAddress);

    deploymentData.contracts.lendingPool = lendingPoolAddress;
    deploymentData.transactions.lendingPool = lendingPool.deploymentTransaction().hash;

    // 6. Deploy aTokens
    console.log("\n🪙 Deploying aTokens...");
    
    const AToken = await ethers.getContractFactory("AToken");
    
    // Deploy aUSDC
    const aUSDC = await AToken.deploy(
      "Aave Mock USD Coin",
      "amUSDC",
      mUSDCAddress,
      deployer.address
    );
    await aUSDC.waitForDeployment();
    const aUSDCAddress = await aUSDC.getAddress();
    console.log("✅ aUSDC deployed to:", aUSDCAddress);
    
    // Deploy aBTC
    const aBTC = await AToken.deploy(
      "Aave Mock Bitcoin",
      "amBTC",
      mBTCAddress,
      deployer.address
    );
    await aBTC.waitForDeployment();
    const aBTCAddress = await aBTC.getAddress();
    console.log("✅ aBTC deployed to:", aBTCAddress);

    deploymentData.contracts.aUSDC = aUSDCAddress;
    deploymentData.contracts.aBTC = aBTCAddress;
    deploymentData.transactions.aUSDC = aUSDC.deploymentTransaction().hash;
    deploymentData.transactions.aBTC = aBTC.deploymentTransaction().hash;

    // 7. Deploy Debt Tokens
    console.log("\n💳 Deploying Debt Tokens...");
    
    const DebtToken = await ethers.getContractFactory("DebtToken");
    
    // Deploy debtUSDC
    const debtUSDC = await DebtToken.deploy(
      "Debt Mock USD Coin",
      "debtmUSDC",
      mUSDCAddress,
      deployer.address
    );
    await debtUSDC.waitForDeployment();
    const debtUSDCAddress = await debtUSDC.getAddress();
    console.log("✅ debtUSDC deployed to:", debtUSDCAddress);
    
    // Deploy debtBTC
    const debtBTC = await DebtToken.deploy(
      "Debt Mock Bitcoin",
      "debtmBTC",
      mBTCAddress,
      deployer.address
    );
    await debtBTC.waitForDeployment();
    const debtBTCAddress = await debtBTC.getAddress();
    console.log("✅ debtBTC deployed to:", debtBTCAddress);

    deploymentData.contracts.debtUSDC = debtUSDCAddress;
    deploymentData.contracts.debtBTC = debtBTCAddress;
    deploymentData.transactions.debtUSDC = debtUSDC.deploymentTransaction().hash;
    deploymentData.transactions.debtBTC = debtBTC.deploymentTransaction().hash;

    // 8. Configure Lending Pool
    console.log("\n🔗 Configuring Lending Pool...");
    
    // Set aTokens in lending pool
    await lendingPool.setAToken(mUSDCAddress, aUSDCAddress);
    await lendingPool.setAToken(mBTCAddress, aBTCAddress);
    console.log("✅ aTokens configured in lending pool");
    
    // Set debt tokens in lending pool
    await lendingPool.setDebtToken(mUSDCAddress, debtUSDCAddress);
    await lendingPool.setDebtToken(mBTCAddress, debtBTCAddress);
    console.log("✅ Debt tokens configured in lending pool");
    
    // Set lending pool in aTokens
    await aUSDC.setLendingPool(lendingPoolAddress);
    await aBTC.setLendingPool(lendingPoolAddress);
    console.log("✅ Lending pool set in aTokens");
    
    // Set lending pool in debt tokens
    await debtUSDC.setLendingPool(lendingPoolAddress);
    await debtBTC.setLendingPool(lendingPoolAddress);
    console.log("✅ Lending pool set in debt tokens");

    // 9. Mint Test Tokens
    console.log("\n💰 Minting test tokens...");
    
    // Mint mUSDC to lender
    await mUSDC.mint(LENDER_ADDRESS, TEST_AMOUNTS.mUSDC);
    console.log(`✅ Minted ${ethers.formatUnits(TEST_AMOUNTS.mUSDC, 6)} mUSDC to lender`);
    
    // Mint mBTC to borrower
    await mBTC.mint(BORROWER_ADDRESS, TEST_AMOUNTS.mBTC);
    console.log(`✅ Minted ${ethers.formatUnits(TEST_AMOUNTS.mBTC, 8)} mBTC to borrower`);

    // 10. Save deployment data
    console.log("\n💾 Saving deployment data...");
    
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, "amoy.json");
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
    console.log("✅ Deployment data saved to:", deploymentFile);

    // 11. Print summary
    console.log("\n🎉 Deployment completed successfully!");
    console.log("=" .repeat(60));
    console.log("📋 DEPLOYMENT SUMMARY");
    console.log("=" .repeat(60));
    console.log(`Network: Polygon Amoy (Chain ID: 80002)`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Lender: ${LENDER_ADDRESS}`);
    console.log(`Borrower: ${BORROWER_ADDRESS}`);
    console.log("");
    console.log("📄 CONTRACT ADDRESSES:");
    console.log(`mUSDC: ${mUSDCAddress}`);
    console.log(`mBTC: ${mBTCAddress}`);
    console.log(`Oracle: ${oracleAddress}`);
    console.log(`Interest Rate Model: ${interestRateModelAddress}`);
    console.log(`Configurator: ${configuratorAddress}`);
    console.log(`Lending Pool: ${lendingPoolAddress}`);
    console.log(`aUSDC: ${aUSDCAddress}`);
    console.log(`aBTC: ${aBTCAddress}`);
    console.log(`debtUSDC: ${debtUSDCAddress}`);
    console.log(`debtBTC: ${debtBTCAddress}`);
    console.log("");
    console.log("🔗 EXPLORER LINKS:");
    console.log(`https://amoy.polygonscan.com/address/${lendingPoolAddress}`);
    console.log("");
    console.log("🚀 Next steps:");
    console.log("1. Run the demo script: npm run demo");
    console.log("2. Start the frontend: cd app && npm run dev");
    console.log("3. Connect your wallet to Polygon Amoy testnet");
    console.log("4. Test the lending protocol functionality");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



