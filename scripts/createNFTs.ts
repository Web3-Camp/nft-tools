// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat"
import contracts from './config'

import { green } from 'colors';
import { writeFileSync } from "fs";
import xlsx from "node-xlsx";
import { config } from 'dotenv';

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

  console.log("NFT Manager Address:", contracts.NFTManager);
  const NFTManager = await ethers.getContractAt("NFTManager", contracts.NFTManager);
  await NFTManager.deployed();

  let sheetDataArray: any[] = [];
  const pageSize = 200;
  let sheets = xlsx.parse(`${metadir}/metainfo.xlsx`);

  for (let idx = 0; idx < sheets.length; idx++) {
    const sheet = sheets[idx];

    let nftName = sheet.name;
    const data: any[] = sheet.data;
    data.shift();

    let dataArray = [["Name", "ImageName", "Desc", "NFTId", "TokenId", "Assets ipfsHash", "Metadata ipfsHash"]];
    let nftArray: any[] = [];

    console.log(`Begin to create NFT ${nftName}...`);
    let nftId = await NFTManager.stringToBytes32(nftName);
    let proxyAddress = await NFTManager.nftIdToProxy(nftId);
    console.log('proxyAddress: ', proxyAddress);

    // 1. create NFT contract if not existed.
    if (proxyAddress === '0x0000000000000000000000000000000000000000') {
      console.log(`The NFT ${nftName} does not exist. Create it.`);
      let tx = await NFTManager.createNFT(nftName, "", []);
      await tx.wait();
      console.log('Create NFT success');

      proxyAddress = await NFTManager.nftIdToProxy(nftId);
      console.log('proxyAddress: ', proxyAddress);
    }

    let ownerAddress = await NFTManager.proxyToOwner(proxyAddress);
    console.log("ownerAddress: ", ownerAddress);

    // 2. batch create NFT token, each tx contains pageSize nfts
    for (let i = 0; i < data.length; i += pageSize) {
      console.log(`batch create NFTs, batch number ${i}`);;
      let page: any[] = data.slice(i, i + pageSize);

      let tokenIds: any[] = [];
      let URIs: any[] = [];

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

    // 3. build single sheet data
    for (let index = 0; index < nftArray.length; index++) {
      const nft = nftArray[index];
      dataArray.push([nft.name, nft.image, nft.desc, nft.nftId, nft.tokenId, nft.assetsIpfsHash, nft.metadataIpfsHash]);
    }

    // 4. push single sheet to sheets
    sheetDataArray.push({ name: nftName, data: dataArray, options: {} });
  }


  // console.log(sheetDataArray);

  // 5. write result to xlsx
  const buffer = xlsx.build(sheetDataArray, { writeOptions: { type: 'binary' } });
  writeFileSync(`./meta/metainfo22222.xlsx`, buffer, { encoding: 'binary' });
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

