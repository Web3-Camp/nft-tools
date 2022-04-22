// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "hardhat"
import contracts from './config'

console.log('contracts: ', contracts)

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Operating contracts with the account:",
    deployer.address
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const ERC1155Proxy = await ethers.getContractAt("ERC1155Proxy", contracts.ERC1155Proxy);

  await ERC1155Proxy.setController(deployer.address);// try to set controller

  const addresses = [
    "0xc1eE7cB74583D1509362467443C44f1FCa981283",
    "0x23CE442eF01E09a4208B370826CD7b0585C28867",
    "0x33d3fF69E5967b3E6Cdc95206F1AbdF0709406F7",
  ]

  await ERC1155Proxy.setURI(1, "ipfs://QmbJmvstJTLASXGiGckroP6SV9AtoAa8XEL7P449A78X25");
  await ERC1155Proxy.mintBatchAddresses(addresses, [1, 1, 1], [1, 1, 1], []);

  await ERC1155Proxy.setURI(2, "ipfs://QmUJ9EFEasW9YnFyyjFHxDChjvcP52ddXq6Yc3w8ujAfNq");
  await ERC1155Proxy.mintBatchAddresses(addresses, [2, 2, 2], [1, 1, 1], []);

  let balance0 = await ERC1155Proxy.balanceOf(addresses[0], 1)
  let balance1 = await ERC1155Proxy.balanceOf(addresses[1], 1)
  let balance2 = await ERC1155Proxy.balanceOf(addresses[2], 1)

  console.log("NFT 1 balance0", balance0.toString());
  console.log("NFT 1 balance1", balance1.toString());
  console.log("NFT 1 balance2", balance2.toString());


  balance0 = await ERC1155Proxy.balanceOf(addresses[0], 2)
  balance1 = await ERC1155Proxy.balanceOf(addresses[1], 2)
  balance2 = await ERC1155Proxy.balanceOf(addresses[2], 2)

  console.log("NFT 2 balance0", balance0.toString());
  console.log("NFT 2 balance1", balance1.toString());
  console.log("NFT 2 balance2", balance2.toString());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

