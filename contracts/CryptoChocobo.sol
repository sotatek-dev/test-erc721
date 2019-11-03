pragma solidity ^0.5.0;

import '@openzeppelin/upgrades/contracts/Initializable.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/ERC721Full.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/ERC721Mintable.sol';

contract CryptoChocobo is Initializable, ERC721Full, ERC721Mintable {
  function initialize() public initializer {
    ERC721.initialize();
    ERC721Enumerable.initialize();
    ERC721Metadata.initialize("CryptoChocobo", "CC1");
    ERC721Mintable.initialize(msg.sender);
  }
}