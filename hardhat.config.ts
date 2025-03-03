import {HardhatUserConfig, vars} from "hardhat/config";
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
    sepolia: {
      // url: `https://eth-mainnet.g.alchemy.com/v2/${vars.get('ALCHEMY_API_KEY')}`,
      url: `https://eth-sepolia.g.alchemy.com/v2/${vars.get('ALCHEMY_API_KEY')}`,
      // accounts: [vars.get('WALLET_ARROW_PRIVATE_KEY')],
      accounts: [vars.get('WALLET_HARIS_PRIVATE_KEY')],
    },
  },
  ignition: {
    strategyConfig: {
      create2: { salt: "0x2b8e5e5a4g7b1b9c3d2e6f7e8f9d1c2e3f4d5b6c7d8e9f0a1b2c3d4e5f7b7d8e" },
    }
  },
  sourcify: {
    enabled: true
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  etherscan: {
    apiKey: vars.get('ETHERSCAN_API_KEY'),
  }
};

/*const config: HardhatUserConfig = {
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
    coinmarketcap: vars.get('COINMARKETCAP_API_KEY'), // Optional: Add your CoinMarketCap API key for real-time gas prices
    L1Etherscan: vars.get('ETHERSCAN_API_KEY'), // Replace with your Etherscan API key
  }
}*/

export default config;
