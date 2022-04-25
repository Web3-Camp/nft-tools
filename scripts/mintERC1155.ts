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
    "Operating contracts with the account:",
    deployer.address
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const sheets: any[] = xlsx.parse(`${metadir}/dist.xlsx`);
  // console.log('sheet 1: ', sheets[0]);

  // console.log('sheet 2: ', sheets[1]);

  // console.log(sheets[0].data[0]);

  const NFTManager = await ethers.getContractAt("NFTManager", contracts.NFTManager);

  let nftDistMap = {}; //{ nftName: {nftId: []}}

  for (let i = 0; i < sheets.length; i++) {
    let sheet = sheets[i];
    let data = sheet.data;
    let sheetName = sheet.name;

    if ("mapping" === sheetName) {
      // It's the mapping sheet. Skip it.
      continue;
    }

    for (let j = 1; j < data.length; j++) {

      // console.log(data[j]);

      let address = data[j][0].toString();
      let tokenId = data[j][1].toString();
      let nftName = data[j][2].toString();
      let name = data[j][3].toString();

      if (!ethers.utils.isAddress(address)) {
        console.error(`Invalid address: ${address}`);
        continue;
      }

      // console.log(`${name} ${green(address)}: ${tokenId}`);

      // let nftId = await NFTManager.stringToBytes32(nftName);
      // let proxyAddress = await NFTManager.nftIdToProxy(nftId);
      // console.log('proxyAddress: ', proxyAddress);

      if (nftName in nftDistMap) {
        if (tokenId in nftDistMap[nftName]) {
          nftDistMap[nftName][tokenId].push(address);
        } else {
          nftDistMap[nftName][tokenId] = [address];
        }
      } else {
        nftDistMap[nftName] = {};
        nftDistMap[nftName][tokenId] = [address];
      }

      // const ERC1155Proxy = await ethers.getContractAt("ERC1155Proxy", proxyAddress);

      // let balance0 = await ERC1155Proxy.balanceOf(addresses[0], 1)
      // console.log("NFT 1 balance0", balance0.toString());
    }
  }
  console.log('nftDistMap: ', nftDistMap);

  // Test code
  // const nftId = await NFTManager.stringToBytes32('xxxxx');
  // let tx = await NFTManager.mintAddresses(nftId, 0, ["0x33d3fF69E5967b3E6Cdc95206F1AbdF0709406F7"]);
  // await tx.wait();
  // return;

  const pageSize = 150;
  for (const nftName in nftDistMap) {
    if (Object.prototype.hasOwnProperty.call(nftDistMap, nftName)) {
      const nft = nftDistMap[nftName];
      const nftId = await NFTManager.stringToBytes32(nftName);
      for (const tokenId in nft) {
        if (Object.prototype.hasOwnProperty.call(nft, tokenId)) {
          const addresses = nft[tokenId];
          for (let i = 0; i < addresses.length; i += pageSize) {
            const page = addresses.slice(i, i + pageSize);

            console.log(page);
            console.log(`${nftId} ${nftName} ${tokenId} ${page.length}`);

            let tx = await NFTManager.mintAddresses(nftId, tokenId, page);
            await tx.wait();
          }
        }
      }
    }
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

