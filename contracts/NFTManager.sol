// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./ERC1155Proxy.sol";
import "./interface/INFTManager.sol";

contract NFTManager is
    INFTManager,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using AddressUpgradeable for address;
    using StringsUpgradeable for uint256;

    // proxy to id
    mapping(address => uint256[]) public ownerToIds;
    mapping(address => uint256) public proxyToId;

    // owner to proxy
    mapping(address => address[]) public ownerToProxies;
    mapping(address => address) public proxyToOwner;

    // nftId to proxy
    mapping(address => bytes32) public proxyToNftId;
    mapping(bytes32 => address) public nftIdToProxy;

    // nftName to nftId
    mapping(string => bytes32) public nftNameToNftId;

    function initialize() public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
    }

    event MintNewNFT(address proxy, string uri, uint256 addressAmount);
    event CreateProxy(address proxy);
    event SetURI(address proxy, uint256 tokenId, string uri);
    event MintExistingNFT(
        address erc1155Proxy,
        string uri,
        uint256 addressAmount
    );
    event MintNFTs(
        address erc1155Proxy,
        uint256 tokenId,
        uint256 addressAmount
    );

    //-------------------------------
    //------- Modifier --------------
    //-------------------------------

    modifier onlyProxyOwner(address _erc1155Proxy) {
        require(
            proxyToOwner[address(_erc1155Proxy)] == msg.sender,
            "NFTManager: Caller is not the owner"
        );
        _;
    }

    //-------------------------------
    //------- Internal Functions ----
    //-------------------------------

    function createProxy() internal returns (address) {
        ERC1155Proxy proxy = new ERC1155Proxy{
            salt: keccak256(
                abi.encode(msg.sender, ownerToProxies[msg.sender].length)
            )
        }();
        proxy.initialize("");
        proxy.setController(address(this));

        ownerToProxies[msg.sender].push(address(proxy));
        proxyToOwner[address(proxy)] = msg.sender;

        emit CreateProxy(address(proxy));
        return address(proxy);
    }

    //-------------------------------
    //------- Users Functions -------
    //-------------------------------

    function createNFT(
        string calldata _name,
        string calldata _uri,
        address[] calldata _addresses
    ) external override nonReentrant {
        require(
            nftNameToNftId[_name] == bytes32(""),
            "NFTManager::createNFT: NFTName already exists"
        );
        bytes32 nftId = keccak256(abi.encodePacked(_name));
        nftNameToNftId[_name] = nftId;

        address erc1155Proxy = createProxy();
        setNFTId(nftId, erc1155Proxy);
        setNFTName(_name, erc1155Proxy);
        if (_addresses.length > 0) {
            mintNewNFT(nftId, _uri, _addresses);
        }
    }

    // set guild id to proxy
    function setNFTId(bytes32 _nftId, address _erc1155Proxy)
        public
        override
        onlyProxyOwner(_erc1155Proxy)
    {
        proxyToNftId[_erc1155Proxy] = _nftId;
        nftIdToProxy[_nftId] = _erc1155Proxy;
    }

    function setNFTName(string memory _name, address _erc1155Proxy)
        public
        override
        onlyProxyOwner(_erc1155Proxy)
    {
        IERC1155Proxy(_erc1155Proxy).setName(_name);
    }

    function mintNewNFT(
        bytes32 _nftId,
        string memory _uri,
        address[] memory _addresses
    ) public override onlyProxyOwner(nftIdToProxy[_nftId]) {
        address _erc1155Proxy = nftIdToProxy[_nftId];
        require(
            _erc1155Proxy != address(0),
            "NFTManager: Must supply a valid NFT address"
        );
        require(
            _addresses.length > 0,
            "NFTManager: Must supply at least one address"
        );

        uint256 tokenId = proxyToId[address(_erc1155Proxy)] + 1;
        IERC1155Proxy(_erc1155Proxy).mintAddresses(_addresses, tokenId, 1, "");
        if (
            keccak256(bytes(_uri)) !=
            keccak256(bytes(IERC1155Proxy(_erc1155Proxy).uri(tokenId)))
        ) {
            IERC1155Proxy(_erc1155Proxy).setURI(tokenId, _uri);
        }

        for (uint256 i = 0; i < _addresses.length; i++) {
            ownerToIds[_addresses[i]].push(tokenId);
        }

        proxyToId[address(_erc1155Proxy)] = tokenId;

        emit MintNewNFT(address(_erc1155Proxy), _uri, _addresses.length);
    }

    function mintExistingNFT(
        bytes32 _nftId,
        string memory _uri,
        address[] memory _addresses
    ) external override nonReentrant onlyProxyOwner(nftIdToProxy[_nftId]) {
        address _erc1155Proxy = nftIdToProxy[_nftId];
        require(
            address(_erc1155Proxy) != address(0),
            "NFTManager: Must supply a valid Proxy address"
        );
        require(
            _addresses.length > 0,
            "NFTManager: Must supply at least one address"
        );

        //
        uint256 tokenId = proxyToId[address(_erc1155Proxy)];
        require(tokenId != 0, "NFTManager: Must supply a valid NFT address");

        IERC1155Proxy(_erc1155Proxy).mintAddresses(_addresses, tokenId, 1, "");
        IERC1155Proxy(_erc1155Proxy).setURI(tokenId, _uri);
        for (uint256 i = 0; i < _addresses.length; i++) {
            ownerToIds[_addresses[i]].push(tokenId);
        }

        emit MintExistingNFT(address(_erc1155Proxy), _uri, _addresses.length);
    }

    function mintAddresses(
        bytes32 _nftId,
        uint256 _tokenId,
        address[] memory _addresses
    ) external override nonReentrant onlyProxyOwner(nftIdToProxy[_nftId]) {
        address _erc1155Proxy = nftIdToProxy[_nftId];
        require(
            address(_erc1155Proxy) != address(0),
            "NFTManager: Must supply a valid Proxy address"
        );
        require(
            _addresses.length > 0,
            "NFTManager: Must supply at least one address"
        );

        IERC1155Proxy(_erc1155Proxy).mintAddresses(_addresses, _tokenId, 1, "");
        for (uint256 i = 0; i < _addresses.length; i++) {
            ownerToIds[_addresses[i]].push(_tokenId);
        }

        emit MintNFTs(address(_erc1155Proxy), _tokenId, _addresses.length);
    }

    function setURI(
        bytes32 _nftId,
        uint256 _tokenId,
        string calldata _uri
    ) external override nonReentrant {
        address _erc1155Proxy = nftIdToProxy[_nftId];
        require(
            _erc1155Proxy != address(0),
            "NFTManager: Must supply a valid NFT address"
        );
        require(
            proxyToOwner[address(_erc1155Proxy)] == msg.sender,
            "NFTManager: Must the owner of proxy"
        );
        IERC1155Proxy(_erc1155Proxy).setURI(_tokenId, _uri);

        emit SetURI(address(_erc1155Proxy), _tokenId, _uri);
    }

    function setURIs(
        bytes32 _nftId,
        uint256[] calldata _tokenIds,
        string[] calldata _uris
    ) external override nonReentrant {
        require(
            _tokenIds.length == _uris.length,
            "NFTManager: Must supply the same number of tokenIds and URIs"
        );
        address _erc1155Proxy = nftIdToProxy[_nftId];
        require(
            _erc1155Proxy != address(0),
            "NFTManager: Must supply a valid NFT address"
        );
        require(
            proxyToOwner[address(_erc1155Proxy)] == msg.sender,
            "NFTManager: Must the owner of proxy"
        );

        for (uint256 index = 0; index < _tokenIds.length; index++) {
            IERC1155Proxy(_erc1155Proxy).setURI(_tokenIds[index], _uris[index]);
            emit SetURI(address(_erc1155Proxy), _tokenIds[index], _uris[index]);
        }
    }

    function getUserIds(address _user)
        external
        view
        override
        returns (uint256[] memory)
    {
        return ownerToIds[_user];
    }

    function getOwnerIds(address _owner)
        external
        view
        override
        returns (uint256[] memory)
    {
        return ownerToIds[_owner];
    }

    function getOwnerProxies(address _owner)
        external
        view
        override
        returns (address[] memory)
    {
        return ownerToProxies[_owner];
    }

    function getURI(bytes32 _nftId, uint256 _tokenId)
        external
        view
        override
        returns (string memory)
    {
        address _erc1155Proxy = nftIdToProxy[_nftId];
        require(
            _erc1155Proxy != address(0),
            "NFTManager: Must supply a valid NFT address"
        );
        return IERC1155Proxy(_erc1155Proxy).uri(_tokenId);
    }

    function tokenTotalSupply(bytes32 _nftId, uint256 _id)
        external
        view
        override
        returns (uint256 amount)
    {
        address _erc1155Proxy = nftIdToProxy[_nftId];
        require(
            _erc1155Proxy != address(0),
            "NFTManager: Must supply a valid NFT address"
        );
        amount = IERC1155Proxy(_erc1155Proxy).tokenTotalSupply(_id);
    }

    function tokenTotalSupplyBatch(bytes32 _nftId, uint256[] calldata _ids)
        external
        view
        override
        returns (uint256[] memory ids)
    {
        address _erc1155Proxy = nftIdToProxy[_nftId];
        require(
            _erc1155Proxy != address(0),
            "NFTManager: Must supply a valid NFT address"
        );
        ids = IERC1155Proxy(_erc1155Proxy).tokenTotalSupplyBatch(_ids);
    }

    function stringToBytes32(string calldata _str)
        external
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(_str));
    }
}
