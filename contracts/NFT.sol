pragma solidity 0.8.17;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFT is ERC721 {
    uint256 supply = 0;
    constructor() ERC721("NFT Name","NN") {}

    function mint() public {
        _safeMint(msg.sender, supply);
        supply++;
    }
}