import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    }
  },

  networks: {
    localhost: {  
      url: "http://127.0.0.1:8545",  
    }, 
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY, // Optional: Add your CoinMarketCap API key for real-time gas prices
    L1Etherscan: process.env.ETHERSCAN_API_KEY, // Replace with your Etherscan API key
  }
}

/*
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    }
  },
  networks: {
    sepolia: {
      url: "https://eth-mainnet.g.alchemy.com/v2/m-754689ST6_xvTzXZd9ApaggUHpTZVr",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
*/

export default config;
