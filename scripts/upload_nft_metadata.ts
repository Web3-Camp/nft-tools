import { green } from 'colors';
import config from './config';
import { readFileSync, writeFileSync, readdirSync} from "fs";
import pinataSDK from '@pinata/sdk';

const pinataApi = process.env.PINATA_API;
const pinataKey = process.env.PINATA_KEY;

const metadir = `./meta`;

async function initPinata() {
  const pinata = pinataSDK(pinataApi, pinataKey);
  await pinata.testAuthentication();
  return pinata;
}

async function publishToPinata (pinata, path, name) {
    const { IpfsHash } = await pinata.pinFromFS(path, {
        pinataMetadata: {name},
    });
    return IpfsHash;
}

async function publishJSONToPinata(pinata, data, name) {
  const { IpfsHash } = await pinata.pinJSONToIPFS(data, {
    pinataMetadata: { name },
  });
  return IpfsHash;
}

async function execute() {
  console.log(green(`========== started ==========`))

  const pinata = await initPinata();

  let tx, nftArray = [], manifests = [], hash;
  let timestamp = Date.now();

  const files = readdirSync(metadir);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    nftArray.push(JSON.parse(readFileSync(`${metadir}/${file}`).toString()));
    const name = file.split('.')[0];
    console.log(green(`uploading ${name}`));
  }

  for (let index = 0; index < nftArray.length; index++) {
    const nft = nftArray[index];

    hash = await publishJSONToPinata(pinata, nft, `nft-info-${nft.name}-${timestamp}`);

    manifests.push(
      {
        nft,
        ipfsHash: hash,
      }
    )

    console.log("ipfs hash: ", hash);
    console.log("nft: ", nft);
  }

  // save manifest
  const manifest = {
    nfts: manifests,
    timestamp: (new Date()).getTime(),
  };

  const outManifest = `${metadir}/manifest.json`;
  const manifestJson = JSON.stringify(manifest, null, 4);
  writeFileSync(outManifest, manifestJson, { encoding: 'utf-8' });

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