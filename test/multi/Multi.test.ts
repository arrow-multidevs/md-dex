// SPDX-License-Identifier: MIT
import { expect } from "chai";
import { ethers } from "hardhat";
import { Multi } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

// Add these helper functions
async function getDigest(
    token: Multi,
    name: string,
    version: string,
    owner: string,
    spender: string,
    value: bigint,
    nonce: bigint,
    deadline: bigint
) {
    const domain = {
        name,
        version,
        chainId: BigInt((await ethers.provider.getNetwork()).chainId),
        verifyingContract: await token.getAddress()
    };

    const types = {
        Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" }
        ]
    };

    const value_ = {
        owner,
        spender,
        value,
        nonce,
        deadline
    };

    return await token.DOMAIN_SEPARATOR();
}

async function signDigest(signer: SignerWithAddress, digest: string) {
    const signature = await signer.signMessage(ethers.getBytes(digest));
    return ethers.Signature.from(signature);
}

describe("MultiToken", function () {
    let multi: Multi;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;

    beforeEach(async () => {
        [owner, addr1] = await ethers.getSigners();
        
        const Multi = await ethers.getContractFactory("Multi");
        multi = await Multi.deploy();
        await multi.waitForDeployment();
    });

    it("Should have correct initial supply", async () => {
        const decimals = await multi.decimals();
        const expectedInitialSupply = 50000n * (10n ** BigInt(decimals));
        expect(await multi.balanceOf(owner.address)).to.equal(expectedInitialSupply);

        // Check total supply matches initial supply
        expect(await multi.totalSupply()).to.equal(expectedInitialSupply);
    });

    it("Should mint, emit Mint event, burn, and emit Burn event", async () => {
        const mintAmount = ethers.parseUnits("100", 18);
        await expect(multi.mint(addr1.address, mintAmount))
            .to.emit(multi, "Mint")
            .withArgs(owner.address, addr1.address, mintAmount);
        expect(await multi.balanceOf(addr1.address)).to.equal(mintAmount);

        const burnAmount = ethers.parseUnits("50", 18);
        await expect(multi.connect(addr1).burn(burnAmount))
            .to.emit(multi, "Burn")
            .withArgs(addr1.address, burnAmount);
        expect(await multi.balanceOf(addr1.address)).to.equal(mintAmount - burnAmount);
    });

    it("Should emit MaxSupplyReached event when minting reaches max supply", async () => {
        const initialSupply = (await multi.totalSupply());
        const maxSupply = (await multi.MAX_SUPPLY());
        const remainingSupply = maxSupply - initialSupply;

        // Ensure remainingSupply is valid
        expect(remainingSupply).to.be.gt(0n);

        // Mint the remaining supply
        await expect(multi.mint(addr1.address, remainingSupply))
            .to.emit(multi, "Mint")
            .withArgs(owner.address, addr1.address, remainingSupply)
            .to.emit(multi, "MaxSupplyReached");

        // Verify total supply is at max
        expect(await multi.totalSupply()).to.equal(maxSupply);
    });

    it("Prevents minting beyond max supply", async () => {
        const initialSupply = await multi.totalSupply();
        const maxSupply = await multi.MAX_SUPPLY();
        const remainingSupply = maxSupply - initialSupply;

        // Mint remaining supply to reach max
        await multi.mint(addr1.address, remainingSupply);

        // Try to mint again (should revert)
        const mintAmount = ethers.parseUnits("1", 18);
        await expect(multi.mint(addr1.address, mintAmount))
            .to.be.revertedWith("Max supply reached");
    });

    it("Should pause and unpause transfers", async () => {
        const transferAmount = ethers.parseUnits("1", 18);
        
        // Pause the contract
        await multi.pause();
        
        // Try to transfer while paused
        await expect(
            multi.transfer(addr1.address, transferAmount)
        ).to.be.revertedWith("Pausable: paused");
        
        // Unpause and try transfer again
        await multi.unpause();
        await multi.transfer(addr1.address, transferAmount);
        
        expect(await multi.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Should only allow owner to mint", async () => {
        const mintAmount = ethers.parseUnits("100", 18);
        await expect(
            multi.connect(addr1).mint(addr1.address, mintAmount)
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow owner to pause", async () => {
        await expect(
            multi.connect(addr1).pause()
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert on burn exceeding balance", async () => {
        await expect(multi.connect(addr1).burn(ethers.parseUnits("1", 18)))
            .to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    it("Should prevent mint/burn during paused state", async () => {
        await multi.pause();
        await expect(multi.mint(addr1.address, 1)).to.be.revertedWith("Pausable: paused");
        await expect(multi.connect(addr1).burn(1)).to.be.revertedWith("Pausable: paused");
    });

    it("Should approve via permit", async () => {
        const deadline = ethers.MaxUint256;
        const value = ethers.parseUnits("100", 18);
        const nonce = await multi.nonces(owner.address);
        
        const domain = {
            name: await multi.name(),
            version: "1",
            chainId: BigInt((await ethers.provider.getNetwork()).chainId),
            verifyingContract: await multi.getAddress()
        };

        const types = {
            Permit: [
                { name: "owner", type: "address" },
                { name: "spender", type: "address" },
                { name: "value", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" }
            ]
        };

        const values = {
            owner: owner.address,
            spender: addr1.address,
            value,
            nonce,
            deadline
        };

        const signature = await owner.signTypedData(domain, types, values);
        const sig = ethers.Signature.from(signature);

        await multi.permit(
            owner.address,
            addr1.address,
            value,
            deadline,
            sig.v,
            sig.r,
            sig.s
        );
        
        expect(await multi.allowance(owner.address, addr1.address)).to.equal(value);
    });

    it("Has correct metadata", async () => {
        expect(await multi.name()).to.equal("Multi Token");
        expect(await multi.symbol()).to.equal("MULTI");
    });

    it("Blocks approve/transferFrom during pause", async () => {
        await multi.pause();
        await expect(multi.approve(addr1.address, 100)).to.be.revertedWith("Pausable: paused");
    });
});