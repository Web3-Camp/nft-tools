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
import ts from "typescript";

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

  console.log(contracts.NFTManager);

  const NFTManager = await ethers.getContractAt("NFTManager", contracts.NFTManager);

  await NFTManager.deployed();

  console.log('Begin to create NFTs...');
  let nftName = 'xxxxx';
  let nftId = await NFTManager.stringToBytes32(nftName);
  let proxyAddress = await NFTManager.nftIdToProxy(nftId);
  console.log('proxyAddress: ', proxyAddress);

  if (proxyAddress === '0x0000000000000000000000000000000000000000') {
    console.log('The NFT does not exist. Create it.');
    let tx = await NFTManager.createNFT(nftName, "", []);
    await tx.wait();
    console.log('Create NFT success');

    proxyAddress = await NFTManager.nftIdToProxy(nftId);
    console.log('proxyAddress: ', proxyAddress);
  }

  let ownerAddress = await NFTManager.proxyToOwner(proxyAddress);
  console.log("ownerAddress: ", ownerAddress);


  // create one by one
  /*
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
    tx.wait();

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
  */

  // batch create
  let pageSize = 200;
  for (let i = 0; i < data.length; i += pageSize) {
    console.log(`batch create NFTs, batch number ${i}`);;
    let page: any[] = data.slice(i, i + pageSize);

    let tokenIds: any[] = [];
    let URIs:any[] = [];

    page.forEach((item, index) => {
      let name: string = item[0].toString();
      let image: string = item[1].toString();
      let desc: string = item[2] || '';
      // let nftId: string = item[3] || '';
      // let tokenId: string = item[4] || '';
      let assetsIpfsHash: string = item[5] || '';
      let metadataIpfsHash: string = item[6] || '';

      let tokenId = i + index; // tokenId is the index of the NFT in the NFTManager.

      tokenIds.push(tokenId);
      URIs.push(metadataIpfsHash);

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
    });

    let tx = await NFTManager.setURIs(nftId, tokenIds, URIs);
    tx.wait();    
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

