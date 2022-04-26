// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "hardhat"
import contracts from './config'

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Upgradeing contracts with the account:",
    deployer.address
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());


  const NFTManager = await ethers.getContractAt("NFTManager", contracts.NFTManager);
  const preVer = await NFTManager.version();
  console.log('preVer: ', preVer);
  

  const Contract = await ethers.getContractFactory("NFTManager");
  const nftManger = await upgrades.upgradeProxy(
    contracts.NFTManager,
    Contract
  )
  const curVer = await nftManger.version();
  console.log('curVer: ', curVer);

  console.log("NFTManager address:", nftManger.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

