import colors from 'colors';
import fs from "fs";

const abidir = `./abis/`;

async function execute() {
  console.log(colors.green(`========== started ==========`))

  let basedir = './artifacts/contracts';
  let contracts:Array<{name:string, path:string}> = [];

  contracts.push({
    name: 'ERC1155Proxy',
    path: `${basedir}/ERC1155Proxy.sol/ERC1155Proxy.json`,
  });

  contracts.push({
    name: 'NFTManager',
    path: `${basedir}/NFTManager.sol/NFTManager.json`,
  });


  for (let index = 0; index < contracts.length; index++) {
    const elem = contracts[index];
    const abi = JSON.parse(fs.readFileSync(elem.path).toString()).abi;
    fs.writeFileSync(`${abidir}/${elem.name}.json`, JSON.stringify(abi, null, 4), { encoding: 'utf-8' });
  }

  console.log(colors.green(`========== ended ==========`))
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