import 'hardhat-deploy-ethers';
import '@nomiclabs/hardhat-etherscan';
import hre, {network} from 'hardhat';
import * as fs from 'fs';
import grydABI from '../artifacts/src/gryd.sol/GRYD.json';
import stakingABI from '../artifacts/src/staking.sol/Staking.json';
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
  contracts: {
    gryd: DeployedContract;
    staking: DeployedContract;
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
      staking: {} as DeployedContract
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

  // Deploy the staking contract and set metadata
  deployed = await deployStaking(deployed)

  let isFuncTest = true;
  if (isFuncTest) {
    await buyStorage(deployed);
  }
  // writer
  await writeFile(deployed)

  if (process.env.MAINNET_ETHERSCAN_KEY || process.env.TESTNET_ETHERSCAN_KEY) {
    console.log('Verifying...');
  }
}

async function deployGRYDProxy(deployed: any) {
  //set args
  let args: string[] = [];
  if (network.name == 'testnet') {
    args = [
      account.address,
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
  return await setMetadata(deployTx, "gryd", deployed, GRYDToken.address, grydABI.abi, grydABI.bytecode.toString())
}

async function deployGRYD(deployed: any) {
  //deploy
  console.log('Deploying GRYD contract...');
  const GRYDTokenContract = await new ethers.ContractFactory(grydABI.abi, grydABI.bytecode).connect(account)
  const GRYDToken = await GRYDTokenContract.deploy(account.address);
  console.log('tx hash:' + GRYDToken.deployTransaction.hash);
  await GRYDToken.deployed();
  console.log("Contract deployed to " + GRYDToken.address)
  let deployTx = await GRYDToken.deployTransaction.wait(1);
  return await setMetadata(deployTx, "gryd", deployed, GRYDToken.address, grydABI.abi, grydABI.bytecode.toString())
}


async function deployStaking(deployed: any) {
  //set args
  let args: string[] = [];
  if (network.name == 'testnet' || 'hardhat') {
    args = [
      account.address,
      "GRYD Token",
      "GRYD"
    ];
  }
  console.log('\nDeploying Staking contract...');
  const StakingToken = new ethers.ContractFactory(stakingABI.abi, stakingABI.bytecode).connect(account);
  const staking = await StakingToken.deploy(...args);
  console.log('tx hash:' + staking.deployTransaction.hash);
  await staking.deployed();
  console.log("Contract deployed to " + staking.address)
  let deployTx = await staking.deployTransaction.wait(1);
  return await setMetadata(deployTx, "staking", deployed, staking.address, stakingABI.abi, stakingABI.bytecode.toString())
}

async function setMetadata(
  deploymentReceipt: any,
  contractName: string,
  deployed: any,
  address: string,
  abi: any,
  bytecode: string) {
  deployed['contracts'][contractName]['abi'] = abi;
  deployed['contracts'][contractName]['bytecode'] = bytecode;
  deployed['contracts'][contractName]['address'] = address;
  deployed['contracts'][contractName]['block'] = deploymentReceipt.blockNumber;
  deployed['contracts'][contractName]['url'] = config.url + "address/" + address;

  return deployed
}

async function buyStorage(deployedData: any) {
  const grydContract = new ethers.Contract(
    deployedData['contracts']['gryd']['address'],
    grydABI.abi,
    account
  );

  const caller = await grydContract.buyStorage(account.address, "eventTest1", 20);
  console.log(caller.transactionHash)
}

async function writeFile(deployed: any) {
  await fs.writeFileSync(config.networkName + '_deployed.json', JSON.stringify(deployed, null, '\t'));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
