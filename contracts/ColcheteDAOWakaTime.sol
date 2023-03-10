// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "./openzeppelin/token/ERC721/ERC721.sol";
import "./openzeppelin/token/ERC721/extensions/ERC721URIStorage.sol";
import "./openzeppelin/utils/Counters.sol";
import "./openzeppelin/security/ReentrancyGuard.sol";

contract ColcheteDAOWakaTime is ERC721, ERC721URIStorage,ReentrancyGuard  {
    using Counters for Counters.Counter;
    uint256 public price = 2560000000000000000;
    address public walletDAO = 0x8BEBdE8931e12c22C9F67663F15C115f40B5621E;
    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("Colchete DAO WakaTime", "CDW") {}

    function _baseURI() internal pure override returns (string memory) {
        return
            "https://ipfs.moralis.io:2053/ipfs/QmTwZ33wjNwnfFfwDNdAkbmrYM2zsCru78keKefa2wCm1s/";
    }

    function mintTo(address to) public payable nonReentrant {
        require(msg.value == price, "CDW: The price of NFT is 2.56 MATIC");
        payable(walletDAO).transfer(address(this).balance);
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked(Strings.toString(tokenId),".json")));
    }

    function mint() public payable{
        mintTo(msg.sender);
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}
