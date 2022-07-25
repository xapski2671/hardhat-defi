require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
  solidity: {
    compilers: [{ version: "0.8.8" }, { version: "0.6.6" }, { version: "0.4.19" }, { version: "0.6.12" }]
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: process.env.ALCHEMY_MAINNET_RPC_URL
      }
    },
    rinkeby: {
      chainId: 4,
      blockConfirmations: 6,
      url: process.env.RINKEBY_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
    },
  },
  gasReporter: {
    enabled: false,
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
    coinmarketcap: process.env.MARKETCAP_API_KEY,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  mocha: {
    timeout: 100000000, // asking mocha to give the testnet more time (100000s)
  },
}
