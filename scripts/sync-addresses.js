const fs = require("fs");
const path = require("path");

/**
 * Syncs contract addresses from deployment files to frontend
 */
async function syncAddresses() {
    console.log("🔄 Syncing contract addresses to frontend...");
    
    try {
        // Read deployment config
        const deploymentPath = path.join(__dirname, "../deploy-config/polygonAmoy.json");
        const localPath = path.join(__dirname, "../deploy-config/local.json");
        
        let deploymentConfig;
        
        // Try to read Polygon Amoy config first, fallback to local
        if (fs.existsSync(deploymentPath)) {
            console.log("📁 Reading Polygon Amoy deployment config...");
            deploymentConfig = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
        } else if (fs.existsSync(localPath)) {
            console.log("📁 Reading local deployment config...");
            deploymentConfig = JSON.parse(fs.readFileSync(localPath, "utf8"));
        } else {
            console.log("⚠️  No deployment config found. Please deploy contracts first.");
            return;
        }
        
        // Create addresses object for frontend
        const addresses = {
            // Core contracts
            lendingPool: deploymentConfig.contracts.LendingPool,
            oracle: deploymentConfig.contracts.PriceOracleMock || deploymentConfig.contracts.OracleAggregator,
            
            // Tokens
            mUSDC: deploymentConfig.contracts.mUSDC,
            mBTC: deploymentConfig.contracts.mBTC,
            
            // aTokens
            aUSDC: deploymentConfig.contracts.amUSDC,
            aBTC: deploymentConfig.contracts.amBTC,
            
            // Debt tokens
            debtUSDC: deploymentConfig.contracts.debtmUSDC,
            debtBTC: deploymentConfig.contracts.debtmBTC,
            
            // Credo Protocol features
            flashLoanProvider: deploymentConfig.contracts.FlashLoanProvider,
            credoToken: deploymentConfig.contracts.CredoToken,
            rewardDistributor: deploymentConfig.contracts.RewardDistributor,
            oracleAggregator: deploymentConfig.contracts.OracleAggregator,
            
            // Network info
            network: deploymentConfig.network,
            chainId: deploymentConfig.chainId
        };
        
        // Write to frontend addresses file
        const frontendAddressesPath = path.join(__dirname, "../app/src/generated/addresses.json");
        fs.writeFileSync(frontendAddressesPath, JSON.stringify(addresses, null, 2));
        console.log("✅ Addresses synced to:", frontendAddressesPath);
        
        // Also create a TypeScript version for better type safety
        const tsAddressesPath = path.join(__dirname, "../app/src/generated/addresses.ts");
        const tsContent = `// Auto-generated file - do not edit manually
export interface ContractAddresses {
  lendingPool: string;
  oracle: string;
  mUSDC: string;
  mBTC: string;
  aUSDC: string;
  aBTC: string;
  debtUSDC: string;
  debtBTC: string;
  flashLoanProvider: string;
  credoToken: string;
  rewardDistributor: string;
  oracleAggregator: string;
  network: string;
  chainId: number;
}

export const addresses: ContractAddresses = ${JSON.stringify(addresses, null, 2)};
`;
        fs.writeFileSync(tsAddressesPath, tsContent);
        console.log("✅ TypeScript addresses created at:", tsAddressesPath);
        
        // Display summary
        console.log("\n📋 Contract Addresses Summary:");
        console.log("=====================================");
        console.log("Network:", addresses.network);
        console.log("Chain ID:", addresses.chainId);
        console.log("\nCore Contracts:");
        console.log("LendingPool:", addresses.lendingPool);
        console.log("Oracle:", addresses.oracle);
        console.log("\nTokens:");
        console.log("mUSDC:", addresses.mUSDC);
        console.log("mBTC:", addresses.mBTC);
        console.log("\nCredo Protocol Features:");
        console.log("FlashLoanProvider:", addresses.flashLoanProvider);
        console.log("CredoToken:", addresses.credoToken);
        console.log("RewardDistributor:", addresses.rewardDistributor);
        console.log("OracleAggregator:", addresses.oracleAggregator);
        
        console.log("\n✅ Address sync completed successfully!");
        
    } catch (error) {
        console.error("❌ Error syncing addresses:", error);
        process.exit(1);
    }
}

// Run sync if called directly
if (require.main === module) {
    syncAddresses();
}

module.exports = { syncAddresses };