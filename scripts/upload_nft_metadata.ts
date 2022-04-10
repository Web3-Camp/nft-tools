import { green } from 'colors';
import constants from './config';
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import pinataSDK from '@pinata/sdk';
import { PinataClient } from '@pinata/sdk';
import xlsx from "node-xlsx";
import { config } from 'dotenv';
import * as path from "path"

config();

const pinataApi = process.env.PINATA_API || '';
const pinataKey = process.env.PINATA_KEY || '';

const metadir = `./meta`;

async function initPinata() {
  const pinata = pinataSDK(pinataApi, pinataKey);
  await pinata.testAuthentication();
  return pinata;
}

async function publishToPinata(pinata: PinataClient, path: string, name: string) {
  const { IpfsHash } = await pinata.pinFromFS(path, {
    pinataMetadata: { name },
  });
  return IpfsHash;
}

async function publishJSONToPinata(pinata: PinataClient, data: JSON | any, name: string) {
  const { IpfsHash } = await pinata.pinJSONToIPFS(data, {
    pinataMetadata: { name },
  });
  return IpfsHash;
}

async function execute() {
  console.log(green(`========== started ==========`))

  const pinata = await initPinata();

  const data: any = xlsx.parse(`./meta/metainfo.xlsx`)[0].data;
  console.log(data);

  let dataArray = [["Name", "ImageName", "Desc", "NFTId", "TokenId", "Assets ipfsHash", "Metadata ipfsHash"]];

  let nftArray: any[] = [];
  let timestamp = Date.now();

  for (let i = 1; i < data.length; i++) {
    console.log(data[i]);

    let name: string = data[i][0].toString();
    let image: string = data[i][1].toString();
    let imageURL: string = path.join(metadir, data[i][1] + '.png');
    let desc: string = data[i][2] || '';
    let nftId: string = data[i][3] || '';
    let tokenId: string = data[i][4] || '';
    let assetsIpfsHash: string = data[i][5] || '';
    let metadataIpfsHash: string = data[i][6] || '';

    let nft = {
      name,
      image,
      imageURL,
      desc,
      nftId,
      tokenId,
      assetsIpfsHash,
      metadataIpfsHash
    }


    let nftMeta = {
      name: name,
      description: desc,
      image: assetsIpfsHash
    }

    let ipfsHash = await publishJSONToPinata(pinata, nftMeta, `nft-info-${nft.name}-${timestamp}`);
    console.log("ipfs hash: ", ipfsHash);

    nft.metadataIpfsHash = ipfsHash;
    console.log("nft: ", nft);

    nftArray.push(nft);
  }

  // save manifest

  const outManifest = `${metadir}/manifest.json`;
  writeFileSync(outManifest, JSON.stringify(nftArray, null, 4), { encoding: 'utf-8' });

  console.log(green(`========== ended ==========`))
}

const main = async () => {
  await execute();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });