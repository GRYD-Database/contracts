# GRYD

## Overview
- TODO

## Setup
This project includes the following smart contracts and their metadata:
- [Smart Contracts](./src)
  - GRYD
  - Staking

- Metadata ([Testnet](./testnet_deployed.json),[Mainnet](./mainnet_deployed.json))
  - **Chain ID**: Chain ID of the blockchain.
  - **ABI**: Interface to communicate with smart contracts.
  - **Bytecode**: Compiled object code that is executed during communication with smart contract.
  - **Address**: Address of the deployed contract on blockchain.
  - **Block**: Block height in which the transaction is mined.
  - **URL**: URL for analyzing the transaction.

### [Scripts](./scripts)
- This dir contains additional helper scripts.

### [Deploy](./deploy)
- This dir contains scripts for deployment.

## Project Setup
### Prerequisites
To set up the project, you will need `yarn` or `node`.

### Setup
To get started with this project, follow these steps:

1. Clone the repo.
2. Run `npm install` or `yarn install` at the root of the repo to install all dependencies.
3. Add a `.env` file in your root directory, where you'll store your sensitive information for deployment. An example file [`.env.example`](./.env.example) is provided for reference.

## Run

### [Tests](./test)
- Unit Tests
  - Run `npm run test` to run all the tests.
  - Run `npm run test:coverage` to see the coverage of smart contracts.

### Deployments

#### Remote

##### Prerequisites
Consult devops/gryd team for infura token or create one from [Infura website](https://infura.io/).

##### Steps
1. Run `npm run compile` to get all the contracts compiled.
2. Run `npm run test` to run all the tests.
3. Configure `.env` file
  - Set your `WALLET_SECRET` in the `.env` file.
  - Set your `INFURA_TOKEN` in the `.env` file.
  - You can also set API keys for etherscan for verification.
4. To deploy all contracts and set roles:
  - Mainnet: `npm run deploy:mainnet`
  - Testnet: `npm run deploy:testnet`
  
**Note:** After successfully deploying to mainnet or testnet the [mainnet_deployed.json](./mainnet_deployed.json) and [testnet_deployed.json](./testnet_deployed.json) will be automatically updated and those changes should be committed if intended.

**Note:** `WALLET_SECRET` can be **Mnemonic** or **Private Key**.

#### Local
- Run `npm run deploy:testnet` to deploy all contracts on hardhat environment(network).
- To deploy on Ganache (or other networks):
  - Add network configuration in your [hardhat.config.ts](./hardhat.config.ts).
      ```
      ganache: {
      url: 'http://localhost:8545',
      accounts,
      chainId: 1337,
      },
      ```
  - Set `WALLET_SECRET` in your env file.
  - To run: `npm run deploy ganache`

#### Additional commands and flags:
* Make necessary changes to [hardhat.config.ts](./hardhat.config.ts).
  * List of available configs can be found [here](https://hardhat.org/hardhat-runner/docs/config).
* Run script `yarn hardhat run <script> --network <network>`
  - **Network**: Configure network name
  - **Script**: Configure script name and path
