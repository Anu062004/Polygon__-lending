require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Environment variables for Polygon Amoy
const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology/";
const POLYGON_AMOY_CHAIN_ID = Number(process.env.POLYGON_AMOY_CHAIN_ID || 80002);
const POLYGON_AMOY_DEPLOYER_KEY = process.env.POLYGON_AMOY_DEPLOYER_KEY || process.env.PRIVATE_KEY || "4eb71f89e0e8f0d30ae4cf5d6d187b8cf288be844dedb9ba5b1bdd14aa4aed43";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.21",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    polygonAmoy: {
      url: POLYGON_AMOY_RPC_URL,
      chainId: POLYGON_AMOY_CHAIN_ID,
      accounts: POLYGON_AMOY_DEPLOYER_KEY ? [POLYGON_AMOY_DEPLOYER_KEY] : [],
      gasPrice: 35000000000, // 35 gwei
    },
    // Legacy network name for backward compatibility
    amoy: {
      url: POLYGON_AMOY_RPC_URL,
      chainId: POLYGON_AMOY_CHAIN_ID,
      accounts: POLYGON_AMOY_DEPLOYER_KEY ? [POLYGON_AMOY_DEPLOYER_KEY] : [],
      gasPrice: 35000000000, // 35 gwei
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "POLYGONSCAN_API_KEY",
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: POLYGON_AMOY_CHAIN_ID,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com/",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};



