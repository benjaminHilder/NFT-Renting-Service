const { expect } = require("chai");
const { ethers, network, time } = require("hardhat");
const { balance, expectRevert} = require("@openzeppelin/test-helpers");

describe("Rent NFT functionality", async() => {
    let RentNFTService;
    let NFT;
    let RentedNFT;


    let acc1, acc2;
    beforeEach(async() => {
        [acc1, acc2, acc3] = await ethers.getSigners();

        const RentNFTServiceContract = await ethers.getContractFactory("RentNFTService");
        const RentNFTServiceDeploy = await RentNFTServiceContract.deploy();
        RentNFTService = await RentNFTServiceDeploy.deployed();

        const NFTContract = await ethers.getContractFactory("NFT");
        const NFTDeploy = await NFTContract.deploy();
        NFT = await NFTDeploy.deployed();

        const RentedNFTContract = await ethers.getContractFactory("RentedNFT");
        RentedNFT = await RentedNFTContract.attach(RentNFTService.RentedNFTAddress());

        await NFT.connect(acc1).mint();
        await NFT.connect(acc1).mint();
        await NFT.connect(acc1).approve(RentNFTService.address, 0);
        await NFT.connect(acc1).approve(RentNFTService.address, 1);
    })

    it("should be able to deposit ERC721 into renting contract and confirm deposit infomation in mappings set to the owner", async() => {
        await RentNFTService.connect(acc1).rentOutNFT(NFT.address, 0, acc2.address, 10);
        await RentNFTService.connect(acc1).rentOutNFT(NFT.address, 1, acc2.address, 10);

        expect(await RentNFTService.NFTOwner(NFT.address, 1)).to.equal(acc1.address);

        expect(await String(await RentedNFT.actualNFTOwner(1))).to.equal(String(acc1.address));
        expect(await String(await RentedNFT.actualNFTAddress(1))).to.equal(String(NFT.address));
        expect(await RentedNFT.actualNFTId(1)).to.equal(1);
        expect(await RentedNFT.rentedOutTime(1)).to.not.equal(0);
        expect(await RentedNFT.rentedOutId(NFT.address, 1)).to.equal(1);
    })

    it("SHOULD NOT allow a withdraw of NFT if the time period for renting has not passed", async() => {
        await RentNFTService.connect(acc1).rentOutNFT(NFT.address, 0, acc2.address, 10);
        await RentNFTService.connect(acc1).rentOutNFT(NFT.address, 1, acc2.address, 10);
        await network.provider.send("evm_increaseTime", [9]);
        await network.provider.send("evm_mine");

        await expectRevert(
            RentNFTService.connect(acc1).claimBackNFT(NFT.address, 1),
            "This NFT rent time has not pass yet"
        )
    })

    it("should allow a withdraw of NFT if the time period for renting has passed", async() => {
        await RentNFTService.connect(acc1).rentOutNFT(NFT.address, 0, acc2.address, 10);
        await RentNFTService.connect(acc1).rentOutNFT(NFT.address, 1, acc2.address, 10);

        await network.provider.send("evm_increaseTime", [11]);
        await network.provider.send("evm_mine");

        await RentNFTService.connect(acc1).claimBackNFT(NFT.address, 1);

        expect(await String(await RentedNFT.actualNFTOwner(1))).to.equal("0x0000000000000000000000000000000000000000");
        expect(await String(await RentedNFT.actualNFTAddress(1))).to.equal("0x0000000000000000000000000000000000000000");
        expect(await RentedNFT.actualNFTId(1)).to.equal(0);
        expect(await RentedNFT.rentedOutTime(1)).to.equal(0);
        expect(await RentedNFT.rentedOutId(NFT.address, 1)).to.equal(0);
    })

    it("withdraw of real NFT should burn rented NFT and return the correct amount of supply left", async() => {
        await RentNFTService.connect(acc1).rentOutNFT(NFT.address, 0, acc2.address, 10);
        await RentNFTService.connect(acc1).rentOutNFT(NFT.address, 1, acc2.address, 10);

        await network.provider.send("evm_increaseTime", [11]);
        await network.provider.send("evm_mine");

        expect(await RentedNFT.totalSupply()).to.equal(2);
        await RentNFTService.connect(acc1).claimBackNFT(NFT.address, 1);
        expect(await RentedNFT.totalSupply()).to.equal(1);
        
    })

    it("SHOULD NOT allow the non real NFT owner to withdraw NFT at anytime (before rent time and after). Only NFT owner can", async() => {
        await RentNFTService.connect(acc1).rentOutNFT(NFT.address, 0, acc2.address, 10);
        await RentNFTService.connect(acc1).rentOutNFT(NFT.address, 1, acc2.address, 10);

        await expectRevert(
            RentNFTService.connect(acc2).claimBackNFT(NFT.address, 1),
            "Only the NFT owner can call this function"
        )

        await network.provider.send("evm_increaseTime", [11]);
        await network.provider.send("evm_mine");

        await expectRevert(
            RentNFTService.connect(acc2).claimBackNFT(NFT.address, 1),
            "Only the NFT owner can call this function"
        )
    })
    
})