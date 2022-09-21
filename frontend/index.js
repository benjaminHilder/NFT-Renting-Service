const { ethers } = require("hardhat")

let provider = new ethers.providers.Web3Provider(window.ethereum)
let signer

const RentServiceAddress = "0xec6755D47e655366095f554D66C3207402c369a0"
const RentServiceAbi = [
    "function rentOutNFT(address _nftAddress, uint256 _nftId, address _renterAddress, uint256 _rentTime)",
    "function claimBackNFT(address _nftAddress, uint256 _nftId)"
]
const RentedNFTAddress = "0xe24eedd589d5e77F2a64C38ce25cb8606764Aa9A"
const RentedNFTAbi = [
    "function getHowMuchRentTimeIsLeft(uint256 _id) public view returns(uint256)"
]
//test nft address (goerli) 0x007cF52114B038F21a92741FAC28B2536e5dD8EB    
const NFTAbi = [
    "function approve(address to, uint256 tokenId)"
]

async function connectWallet() {
    await provider.send("eth_requestAccounts", []);

    signer = await provider.getSigner();

    console.log("Account address: ", await signer.getAddress())
}

async function approveRentingContract() {
    const nftContract = new ethers.Contract(document.getElementById('NFT Address rent').value, NFTAbi, provider);
    const txResponse = await nftContract.connect(signer).approve(RentServiceAddress,
                                                                 document.getElementById('NFT ID rent').value)
    console.log(txResponse);
}

async function sendNFTToRent() {
    const rentServiceContract = new ethers.Contract(RentServiceAddress, RentServiceAbi, provider);
    const txResponse = await rentServiceContract.connect(signer).rentOutNFT(document.getElementById('NFT Address rent').value,
                                                                            document.getElementById('NFT ID rent').value,
                                                                            document.getElementById('Renter Address').value,
                                                                            document.getElementById('Rent Time').value)
    console.log(txResponse);
}

async function claimNFTBack() {
    const rentServiceContract = new ethers.Contract(RentServiceAddress, RentServiceAbi, provider);
    const txResponse = await rentServiceContract.connect(signer).claimBackNFT(document.getElementById('NFT Address claim').value,
                                                                              document.getElementById('NFT ID claim').value,)
    console.log(txResponse);
}

async function getHowMuchRentTimeIsLeft() {
    const rentNFTContract = new ethers.Contract(RentedNFTAddress, RentedNFTAbi, provider);
    const txResponse = await rentNFTContract.getHowMuchRentTimeIsLeft(document.getElementById('rent time').value)

    console.log("time: " + txResponse);
}