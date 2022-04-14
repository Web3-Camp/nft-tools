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
    "Deploying contracts with the account:",
    deployer.address
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const addresses = [
    "0xc1eE7cB74583D1509362467443C44f1FCa981283",
    "0x23CE442eF01E09a4208B370826CD7b0585C28867",
    "0x33d3fF69E5967b3E6Cdc95206F1AbdF0709406F7",
  ]

  const NFTManager = await ethers.getContractAt("NFTManager", contracts.NFTManager);

  console.log('Create My NFT 1');
  let nft1Name = 'NFT1';
  let nft1URI = 'ipfs://QmbJmvstJTLASXGiGckroP6SV9AtoAa8XEL7P449A78X25';

  await NFTManager.createNFT(nft1Name, "", []);

  console.log('ownerToProxies');
  let proxyAddress = await NFTManager.ownerToProxies(deployer.address, 0);
  console.log('proxyAddress: ', proxyAddress);

  let nft1Id = await NFTManager.stringToBytes32(nft1Name);

  // let proxyAddress = await NFTManager.nftIdToProxy(nft1Id);

  // let ownerAddress = await NFTManager.proxyToOwner(proxyAddress);
  // console.log("ownerAddress: ", ownerAddress);
  // await NFTManager.mintExistingNFT(nft1Id, nft1URI, addresses);
  console.log('Mint My NFT 1');
  await NFTManager.mintNewNFT(nft1Id, nft1URI, addresses);


  console.log('Create My NFT 2');
  let nft2Name = 'NFT2';
  let nft2URI = 'ipfs://QmUJ9EFEasW9YnFyyjFHxDChjvcP52ddXq6Yc3w8ujAfNq';
  await NFTManager.createNFT(nft2Name, "", []);

  console.log('ownerToProxies');
  proxyAddress = await NFTManager.ownerToProxies(deployer.address, 1);
  console.log('proxyAddress: ', proxyAddress);

  let nft2Id = await NFTManager.stringToBytes32(nft2Name);
  // await NFTManager.mintExistingNFT(nft2Id, nft2URI, addresses);
  console.log('Mint My NFT 2');
  await NFTManager.mintNewNFT(nft2Id, nft2URI, addresses);

  let ERC1155Proxy = await ethers.getContractAt("ERC1155Proxy", contracts.ERC1155Proxy);


  const balance0 = await ERC1155Proxy.balanceOf(addresses[0], 1)
  const balance1 = await ERC1155Proxy.balanceOf(addresses[1], 1)
  const balance2 = await ERC1155Proxy.balanceOf(addresses[2], 1)

  console.log("balance0", balance0.toString());
  console.log("balance1", balance1.toString());
  console.log("balance2", balance2.toString());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

