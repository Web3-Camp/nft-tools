const { expect } = require("chai")
const { ethers } = require("hardhat")
const ZERO_GUILD_ID = '0x0000000000000000000000000000000000000000000000000000000000000000'

describe("NFTManager contract...", function () {
  let nftManager;
  let owner
  let alice
  let bob
  let nftId1 = 1
  let nftId2 = 2
  let nftId3 = 3

  const erc1155proxyJson = require('../artifacts/contracts/ERC1155Proxy.sol/ERC1155Proxy.json');

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners()

    const NFTManager = await ethers.getContractFactory("NFTManager");
    nftManager = await upgrades.deployProxy(NFTManager, []);

    expect(nftManager.address).to.not.be.null;
  });

  it("should be able to create nft repeat with revert", async () => {
    await expect(nftManager.createNFT("NFT", "", []))
    await expect(nftManager.createNFT("NFT", "", []))
      .to.be.revertedWith('NFTManager::createNFT: NFTName already exists');
  })

  it("should be able to create a new NFT", async function () {
    nftName = "NFT1";
    // 创建一个新的1155代理
    await nftManager.createNFT(nftName, "", []);
    let proxyAddress = await nftManager.ownerToProxies(owner.address, 0);
    expect(proxyAddress.length).to.be.equal(42);

    // // 设置并获取1155代理的公会ID
    let nftId = await nftManager.stringToBytes32(nftName);
    await nftManager.setNFTId(nftId, proxyAddress);

    proxyAddress2 = await nftManager.nftIdToProxy(nftId);
    let gid = await nftManager.proxyToNftId(proxyAddress)
    expect(proxyAddress).to.be.equal(proxyAddress2);
    expect(nftId).to.be.equal(gid);

    // alice创建一个新的1155代理
    nftName2 = "Social Wiki";
    await nftManager.connect(alice).createNFT(nftName2, "", []);
    nftId2 = await nftManager.stringToBytes32(nftName2);
    proxyAddress = await nftManager.ownerToProxies(alice.address, 0);
    expect(proxyAddress.length).to.be.equal(42);
    let proxy_ = await new ethers.Contract(proxyAddress, erc1155proxyJson.abi, alice);
    const proxyName = await proxy_.name();
    expect(proxyName).to.be.equal(nftName2);

    // 设置并获取1155代理的公会ID
    await expect(
      nftManager.setNFTId(nftId2, proxyAddress)
    ).to.be.revertedWith('NFTManager: Caller is not the owner');

    await nftManager.connect(alice).setNFTId(nftId2, proxyAddress)
    proxyAddress2 = await nftManager.nftIdToProxy(nftId2);
    gid = await nftManager.proxyToNftId(proxyAddress)
    expect(proxyAddress).to.be.equal(proxyAddress2);
    expect(nftId2).to.be.equal(gid);
  })

  it("mintNewNFT", async function () {
    nftName3 = "NFT3";
    await nftManager.connect(alice).createNFT(nftName3, "", []);
    nftId3 = await nftManager.stringToBytes32(nftName3);
    await expect(
      nftManager.mintNewNFT(nftId3, 'ipfs://aaaa', [alice.address, bob.address])
    ).to.be.revertedWith('NFTManager: Caller is not the owner');

    proxy = await nftManager.ownerToProxies(alice.address, 0);
    await nftManager.connect(alice).mintNewNFT(nftId3, 'ipfs://bbbb', [alice.address]);

    const aliceIds = await nftManager.getUserIds(alice.address)
    const bobIds = await nftManager.getUserIds(bob.address)
    const ownerIds = await nftManager.getUserIds(owner.address)

    expect(aliceIds.length).to.equal(1)
    expect(bobIds.length).to.equal(0)
    expect(ownerIds.length).to.equal(0)
  })

  it("setURI", async function () {
    nftName4 = "NFT4";
    await nftManager.connect(bob).createNFT(nftName4, "", []);
    nftId4 = await nftManager.stringToBytes32(nftName4);
    let proxy = await nftManager.ownerToProxies(bob.address, 0);
    let proxy_ = await new ethers.Contract(proxy, erc1155proxyJson.abi, bob);

    await nftManager.connect(bob).setURI(nftId4, 11, "ipfs://test")
    expect(await proxy_.uri(11)).to.equal("ipfs://test")

    await nftManager.connect(bob).setURI(nftId4, 2000002, "ipfs://test2")
    expect(await proxy_.uri(2000002)).to.equal("ipfs://test2")
    expect(await proxy_.uri(3000002)).to.equal("")
  })

  it("tokenTotalSupply", async function () {
    nftName5 = "NFT5";
    await nftManager.connect(owner).createNFT(nftName5, "ipfs://test", [alice.address, bob.address]);
    nftId5 = await nftManager.stringToBytes32(nftName5);

    proxy = await nftManager.ownerToProxies(owner.address, 0)
    proxy_ = await new ethers.Contract(proxy, erc1155proxyJson.abi, alice);
    expect(await proxy_.tokenTotalSupply(1000002)).to.equal(0)
    expect(await nftManager.tokenTotalSupply(nftId5, 1000002)).to.equal(0)
  })

  it("tokenTotalSupplyBatch", async function () {
    nftName5 = "NFT6";
    await nftManager.connect(bob).createNFT(nftName5, "ipfs://test", [alice.address, bob.address]);
    nftId5 = await nftManager.stringToBytes32(nftName5);

    let proxy = await nftManager.ownerToProxies(bob.address, 0);

    await nftManager.connect(bob).mintNewNFT(nftId5, 'ipfs://22222', [alice.address, bob.address]);
    await nftManager.connect(bob).mintNewNFT(nftId5, 'ipfs://33333', [alice.address, bob.address, owner.address]);

    const tokenTotalSupplyBatch = await nftManager.tokenTotalSupplyBatch(nftId5, [1, 2, 3])
    expect(tokenTotalSupplyBatch.length).to.equal(3)
    expect(tokenTotalSupplyBatch[0]).to.equal(2)
  })

  it("mintExistingNFT", async () => {
    nftName7 = "NFT7";
    await nftManager.connect(bob).createNFT(nftName7, "ipfs://test", [alice.address, bob.address]);
    nftId7 = await nftManager.stringToBytes32(nftName7);

    proxy = await nftManager.ownerToProxies(bob.address, 0);
    await nftManager.connect(bob).mintExistingNFT(nftId7, 'ipfs://test1', [alice.address]);

    expect((await nftManager.getUserIds(alice.address)).length).to.equal(2)
    expect((await nftManager.getUserIds(bob.address)).length).to.equal(1)
    expect((await nftManager.getUserIds(owner.address)).length).to.equal(0)
  })

  it("create 2 nfts", async () => {
    const nftName1 = "NFT1";
    const nftName2 = "NFT2";
    await nftManager.createNFT(nftName1, "ipfs://test", [alice.address, bob.address]);
    await nftManager.createNFT(nftName2, "ipfs://test", [alice.address, bob.address]);
    const nftId1 = await nftManager.nftNameToNftId(nftName1);
    const nftId2 = await nftManager.nftNameToNftId(nftName2);
    const proxy1 = await nftManager.nftIdToProxy(nftId1);
    const proxy2 = await nftManager.nftIdToProxy(nftId2);
    const proxies = await nftManager.getOwnerProxies(owner.address);
    expect(proxies.length).to.equal(2);
    expect(proxy1).to.equal(proxies[0]);
    expect(proxy2).to.equal(proxies[1]);

    expect((await nftManager.getUserIds(alice.address)).length).to.equal(2)
    expect((await nftManager.getUserIds(bob.address)).length).to.equal(2)
    expect((await nftManager.getUserIds(owner.address)).length).to.equal(0)
  })
})

