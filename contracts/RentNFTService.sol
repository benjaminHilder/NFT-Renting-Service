pragma solidity 0.8.17;
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./RentedOutNFT.sol";

contract RentNFTService is IERC721Receiver {
    address public RentedNFTAddress;
    
    mapping(address => mapping(uint256 => address)) public NFTOwner;
    
    constructor() {
        RentedNFT RentNFT = new RentedNFT();
        RentedNFTAddress = address(RentNFT);
    }

    function rentOutNFT(address _nftAddress, uint256 _nftId, address _renterAddress, uint256 _rentTime) public {
        RentedNFT RentedNFTContract = RentedNFT(RentedNFTAddress);
        depositNFT(_nftAddress, _nftId);
        RentedNFTContract.mint(_nftAddress, _nftId, _renterAddress, _rentTime); 
    }

    function depositNFT(address _nftAddress, uint256 _nftId) internal {
        //address must approve NFT contract & ID for this contract
        ERC721 NFT = ERC721(_nftAddress);
        NFT.safeTransferFrom(msg.sender, address(this), _nftId);
        NFTOwner[_nftAddress][_nftId] = msg.sender;
    }

    function claimBackNFT(address _nftAddress, uint256 _nftId) public {
        require(NFTOwner[_nftAddress][_nftId] == msg.sender, "Only the NFT owner can call this function");
        
        RentedNFT RNFT = RentedNFT(RentedNFTAddress);

        //burn function checks if time has passed
        RNFT.burn(_nftAddress, _nftId);

        ERC721 NFT = ERC721(_nftAddress);
        NFT.safeTransferFrom(address(this), msg.sender, _nftId);

        delete NFTOwner[_nftAddress][_nftId];
    }

    //required function for ERC721 Receiver
    function onERC721Received(
        address,
        address from,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {        
        return IERC721Receiver.onERC721Received.selector;
    }
}