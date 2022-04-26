// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "hardhat"
import { NonceManager } from "@ethersproject/experimental";


async function main() {
  const [deployer] = await ethers.getSigners();

  const price = await deployer.getGasPrice();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  console.log(
    "Deploying contracts with gasprice:",
    ethers.utils.formatEther(price)
  );

  // increase nonce
  let managedSigner = new NonceManager(deployer);
  console.log("nonce: ", await managedSigner.getTransactionCount("pending"));
  // managedSigner.setTransactionCount(0);
  // console.log("After increase nonce: ", await managedSigner.getTransactionCount("pending"));

  console.log("Account balance:", (await deployer.getBalance()).toString());
  const Contract = await ethers.getContractFactory("NFTManager");
  Contract.connect(managedSigner);

  const result = await upgrades.deployProxy(Contract, []);

  console.log("NFTManager address:", result.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

