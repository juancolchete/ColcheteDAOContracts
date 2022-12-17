// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./openzeppelin/token/ERC721/ERC721.sol";
import "./openzeppelin/token/ERC721/extensions/ERC721URIStorage.sol";
import "./openzeppelin/access/Ownable.sol";
import "./openzeppelin/utils/Counters.sol";

contract ColcheteDAOWakaTime is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    uint256 public price = 2560000000000000000;
    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("Colchete DAO WakaTime", "CDW") {}
ou
    function mint(address to, string memory uri) public payable {
        require(msg.value == price,"CDW: The price of NFT is 2.56 MATIC");
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}