// SPDX-License-Identifier: unlicensed
pragma solidity ^0.8.0;

import './IERC1155Proxy.sol';

interface INFTManager {
  function createNFT(
    string calldata _name,
    string calldata _uri,
    address[] calldata _addresses
  ) external;

  function setNFTId(bytes32 _nftId, address _erc1155Proxy) external;

  function setNFTName(string calldata _NFTName, address _erc1155Proxy) external;

  function mintNewNFT(
    bytes32 _nftId,
    string memory _uri,
    address[] memory _addresses
  ) external;

  function mintExistingNFT(
    bytes32 _nftId,
    string memory _uri,
    address[] memory _addresses
  ) external;

  function setURI(
    bytes32 _nftId,
    uint256 _tokenId,
    string calldata _uri
  ) external;

  function getUserIds(address _user) external view returns (uint256[] memory);

  function getOwnerIds(address _owner) external view returns (uint256[] memory);

  function getOwnerProxies(address _owner) external view returns (address[] memory);

  function getURI(bytes32 _nftId, uint256 _tokenId) external view returns (string memory);

  function tokenTotalSupply(bytes32 _nftId, uint256 _id) external view returns (uint256 amount);

  function tokenTotalSupplyBatch(bytes32 _nftId, uint256[] calldata _ids)
    external
    view
    returns (uint256[] memory ids);
}
