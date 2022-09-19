pragma solidity 0.8.17;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./RentNFTService.sol";

contract RentedNFT is ERC721, ERC721Enumerable {
    address RentServiceContract;    

    mapping(uint256 => address) public actualNFTOwner;
    mapping(uint256 => address) public actualNFTAddress;
    mapping(uint256 => uint256) public actualNFTId; // Rent NFT id => Real NFT id
    mapping(uint256 => uint256) public rentedOutTime; // Time NFT is rented for

    mapping(address => mapping(uint256 => uint256)) public rentedOutId; // Real NFT => Rent NFT id
    
    constructor() ERC721("Rented NFT", "RNFT") {
        RentServiceContract = msg.sender;
    }

    modifier RentServiceOnly() {
        require(msg.sender == RentServiceContract, "Only the rent NFT contract can call this");
        _;
    }

    function mint(address _nftAddress, uint256 _nftId, address _rentOwner, uint256 _rentTime) public RentServiceOnly{
        //actualNFTOwner
        RentNFTService RNFTService = RentNFTService(RentServiceContract);
        actualNFTOwner[totalSupply()] = RNFTService.NFTOwner(_nftAddress, _nftId);
    
        actualNFTAddress[totalSupply()] = _nftAddress;
        actualNFTId[totalSupply()] = _nftId;
        rentedOutTime[totalSupply()] = block.timestamp + _rentTime;

        rentedOutId[_nftAddress][_nftId] = totalSupply();

        _safeMint(_rentOwner, totalSupply());
    }

    function burn(address _actualNFTAddress, uint256 _actualNFTId) public RentServiceOnly{
        uint256 rentId = rentedOutId[_actualNFTAddress][_actualNFTId];

        require(block.timestamp > rentedOutTime[rentId], "This NFT rent time has not pass yet");

        _burn(rentId);
    
        delete actualNFTOwner[rentId];
        delete actualNFTAddress[rentId];
        delete actualNFTId[rentId];
        delete rentedOutTime[rentId];
        delete rentedOutId[_actualNFTAddress][_actualNFTId];
    }

    //ERC721Enumerable function
    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    //ERC721Enumerable function
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}