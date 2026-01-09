import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-vyper";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  vyper: {
    version: "0.3.0",
  },
  networks: {
    kairos: {
      url: "https://public-en-kairos.node.kaia.io",
      accounts: [
        "0x99682c999e36059bdac25df003719aed9d62cb39efbb377508ab47369db274b5"
      ],
    },
  },
    etherscan: {
        apiKey: {
          kairos: "unnecessary",
        },
        customChains: [
          {
            network: "kairos",
            chainId: 1001,
            urls: {
              apiURL: "https://kairos-api.kaiascan.io/hardhat-verify",
              browserURL: "https://kairos.kaiascan.io",
            }
          },
        ]
      }
  };

export default config;