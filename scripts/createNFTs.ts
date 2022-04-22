// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "hardhat"
import contracts from './config'

import { green } from 'colors';
import constants from './config';
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import pinataSDK from '@pinata/sdk';
import { PinataClient } from '@pinata/sdk';
import xlsx from "node-xlsx";
import { config } from 'dotenv';
import * as path from "path"

config();

console.log('contracts: ', contracts)

const metadir = `./meta`; // the information of the NFTs located.

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());


  const data: any[] = xlsx.parse(`${metadir}/metainfo.xlsx`)[0].data;
  data.shift();

  let dataArray = [["Name", "ImageName", "Desc", "NFTId", "TokenId", "Assets ipfsHash", "Metadata ipfsHash"]];

  let nftArray: any[] = [];
  let timestamp = Date.now();

  const NFTManager = await ethers.getContractAt("NFTManager", contracts.NFTManager);

  console.log('Create NFT');
  let nftName = 'xxxxx';
  // await NFTManager.createNFT(nftName, "", []);
  let nftId = await NFTManager.stringToBytes32(nftName);
  let proxyAddress = await NFTManager.nftIdToProxy(nftId);
  console.log('proxyAddress: ', proxyAddress);

  let ownerAddress = await NFTManager.proxyToOwner(proxyAddress);
  console.log("ownerAddress: ", ownerAddress);


  for (let i = 0; i < data.length; i++) {
    // console.log(data[i]);

    let name: string = data[i][0].toString();
    let image: string = data[i][1].toString();
    let desc: string = data[i][2] || '';
    // let nftId: string = data[i][3] || '';
    // let tokenId: string = data[i][4] || '';
    let assetsIpfsHash: string = data[i][5] || '';
    let metadataIpfsHash: string = data[i][6] || '';

    console.log(nftId, i, metadataIpfsHash);
    let tx = await NFTManager.setURI(nftId, i, metadataIpfsHash);

    let tokenId = i;

    let nft = {
      name,
      image,
      desc,
      nftId,
      tokenId,
      assetsIpfsHash,
      metadataIpfsHash
    }

    nftArray.push(nft);
  }

  for (let index = 0; index < nftArray.length; index++) {
    const nft = nftArray[index];
    dataArray.push([nft.name, nft.image, nft.desc, nft.nftId, nft.tokenId, nft.assetsIpfsHash, nft.metadataIpfsHash]);
  }

  // console.log(dataArray);

  const buffer = xlsx.build([{ name: "meta", data: dataArray, options: {} }], { writeOptions: { type: 'binary' } });
  writeFileSync(`./meta/metainfo1.xlsx`, buffer, { encoding: 'binary' });
  console.log(green(`========== ended ==========`))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

