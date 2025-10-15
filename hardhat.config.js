require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "4eb71f89e0e8f0d30ae4cf5d6d187b8cf288be844dedb9ba5b1bdd14aa4aed43";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.21",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    amoy: {
      url: "https://rpc-amoy.polygon.technology/",
      chainId: 80002,
      accounts: [PRIVATE_KEY],
      gasPrice: 35000000000, // 35 gwei
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: "POLYGONSCAN_API_KEY", // Add your API key
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com/",
        },
      },
    ],
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};



