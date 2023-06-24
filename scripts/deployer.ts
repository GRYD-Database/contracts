import 'hardhat-deploy-ethers';
import '@nomiclabs/hardhat-etherscan';
import hre, {network} from 'hardhat';
import * as fs from 'fs';
import grydABI from '../artifacts/src/gryd.sol/GRYD.json';
import {ethers} from 'ethers';
import {InfuraToken} from '../hardhat.config';
import '@nomiclabs/hardhat-etherscan/dist/src/type-extensions';
import '@openzeppelin/hardhat-upgrades';
const {upgrades} = require("hardhat")

let account: ethers.Wallet;

let configurations: ChainConfig;

interface DeployedContract {
  abi: Array<unknown>;
  bytecode: string;
  address: string;
  block: number;
  url: string;
}

interface DeployedData {
  chainId: number;
  networkId: number;
  contracts: {
    gryd: DeployedContract;
  };
}

interface ChainConfig {
  chainId?: number;
  networkName: string;
  deployedData: DeployedData;
  url: string;
}

interface Mnemonic {
  mnemonic: string;
}

let networkDeployedData: DeployedData;
try {
  networkDeployedData = require('../' + network.name + '_deployed.json');
} catch (e) {
  networkDeployedData = {
    chainId: network.config.chainId,
    contracts: {
      gryd: {} as DeployedContract,
    },
  } as unknown as DeployedData;
}

const configs: Record<string, ChainConfig> = {
  testnet: {
    chainId: network.config.chainId,
    networkName: network.name,
    deployedData: networkDeployedData,
    url: hre.config.etherscan.customChains[0]['urls']['browserURL'].toString(),
  },
  mainnet: {
    chainId: network.config.chainId,
    networkName: network.name,
    deployedData: networkDeployedData,
    url: hre.config.etherscan.customChains[1]['urls']['browserURL'].toString(),
  },
};

const config: ChainConfig = configs[network.name]
  ? configs[network.name]
  : ({
    chainId: network.config.chainId,
    networkId: networkDeployedData.networkId ? networkDeployedData.networkId : network.config.chainId,
    networkName: network.name,
    deployedData: networkDeployedData,
    url: '',
  } as ChainConfig);

const blockChainVendor = hre.network.name;

async function setConfigurations() {
  let wallet: ethers.Wallet;
  if (Array.isArray(hre.network.config.accounts)) {
    if (hre.network.config.accounts.length > 1) {
      throw new Error('only 1 private key expected');
    }
    wallet = new ethers.Wallet(hre.network.config.accounts[0] as string);
  } else if (isMnemonic(hre.network.config.accounts)) {
    wallet = ethers.Wallet.fromMnemonic(hre.network.config.accounts.mnemonic);
  } else {
    throw new Error('unknown type');
  }
  switch (blockChainVendor) {
    case 'testnet':
      account = wallet.connect(new ethers.providers.JsonRpcProvider('https://goerli.infura.io/v3/' + InfuraToken));
      console.log('https://goerli.infura.io/v3/' + InfuraToken)
      configurations = configs['testnet'];
      break;
    case 'mainnet':
      account = wallet.connect(new ethers.providers.JsonRpcProvider(process.env.MAINNETPROVIDER));
      configurations = configs['mainnet'];
      break;
    default:
      account = wallet.connect(hre.ethers.provider);
      configurations = configs['private'];
  }
}

function isMnemonic(param: unknown): param is Mnemonic {
  return typeof param === 'object' && param != null && 'mnemonic' in param;
}

async function main() {
  //set configs
  await setConfigurations()

  let deployed = await JSON.parse(JSON.stringify(config.deployedData).toString());

  // Deploy the GRYD contract and set metadata
  deployed = await deployGRYD(deployed)

  // writer
  await writeFile(deployed)

  if (process.env.MAINNET_ETHERSCAN_KEY || process.env.TESTNET_ETHERSCAN_KEY) {
    console.log('Verifying...');
  }
}

async function deployGRYD(deployed: any) {
  //set args
  let args: string[] = [];
  if (network.name == 'testnet') {
    args = [
      account.address,
    ];
  } else if (network.name == 'testnet') {
    args = [
      account.address
    ];
  }

  //set opts
  let opts: object = {
    initializer: "initialize",
    kind: "uups"
  }

  //deploy
  console.log('Deploying contract...');
  const GRYDTokenContract = await new ethers.ContractFactory(grydABI.abi, grydABI.bytecode).connect(account)
  const GRYDToken = await upgrades.deployProxy(
    GRYDTokenContract,
    args,
    opts
  )
  await GRYDToken.deployed()
  console.log("Contract deployed to " + GRYDToken.address)
  let deployTx = await GRYDToken.deployTransaction.wait(3);
  return await setMetadata(deployTx, "gryd", deployed, GRYDToken.address)
}

async function setMetadata(deploymentReceipt: any, contractName: string, deployed: any, address: string) {
  deployed['contracts'][contractName]['abi'] = grydABI.abi;
  deployed['contracts'][contractName]['bytecode'] = grydABI.bytecode.toString();
  deployed['contracts'][contractName]['address'] = address;
  deployed['contracts'][contractName]['block'] = deploymentReceipt.blockNumber;
  deployed['contracts'][contractName]['url'] = config.url + address;

  return deployed
}

async function writeFile(deployed: any) {
  fs.writeFileSync(config.networkName + '_deployed.json', JSON.stringify(deployed, null, '\t'));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
