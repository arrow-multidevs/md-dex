// SPDX-License-Identifier: MIT
import { expect } from "chai";
import { ethers } from "hardhat";
import { Arrow } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

// Add these helper functions
async function getDigest(
    token: Arrow,
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

describe("ArrowToken", function () {
    let arrow: Arrow;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;

    beforeEach(async () => {
        [owner, addr1] = await ethers.getSigners();
        
        const Arrow = await ethers.getContractFactory("Arrow");
        arrow = await Arrow.deploy();
        await arrow.waitForDeployment();
    });

    it("Should have correct initial supply", async () => {
        const decimals = await arrow.decimals();
        const expectedInitialSupply = 50000n * (10n ** BigInt(decimals));
        expect(await arrow.balanceOf(owner.address)).to.equal(expectedInitialSupply);

        // Check total supply matches initial supply
        expect(await arrow.totalSupply()).to.equal(expectedInitialSupply);
    });

    it("Should mint, emit Mint event, burn, and emit Burn event", async () => {
        const mintAmount = ethers.parseUnits("100", 18);
        await expect(arrow.mint(addr1.address, mintAmount))
            .to.emit(arrow, "Mint")
            .withArgs(owner.address, addr1.address, mintAmount);
        expect(await arrow.balanceOf(addr1.address)).to.equal(mintAmount);

        const burnAmount = ethers.parseUnits("50", 18);
        await expect(arrow.connect(addr1).burn(burnAmount))
            .to.emit(arrow, "Burn")
            .withArgs(addr1.address, burnAmount);
        expect(await arrow.balanceOf(addr1.address)).to.equal(mintAmount - burnAmount);
    });

    it("Should emit MaxSupplyReached event when minting reaches max supply", async () => {
        const initialSupply = (await arrow.totalSupply());
        const maxSupply = (await arrow.MAX_SUPPLY());
        const remainingSupply = maxSupply - initialSupply;

        // Ensure remainingSupply is valid
        expect(remainingSupply).to.be.gt(0n);

        // Mint the remaining supply
        await expect(arrow.mint(addr1.address, remainingSupply))
            .to.emit(arrow, "Mint")
            .withArgs(owner.address, addr1.address, remainingSupply)
            .to.emit(arrow, "MaxSupplyReached");

        // Verify total supply is at max
        expect(await arrow.totalSupply()).to.equal(maxSupply);
    });

    it("Prevents minting beyond max supply", async () => {
        const initialSupply = await arrow.totalSupply();
        const maxSupply = await arrow.MAX_SUPPLY();
        const remainingSupply = maxSupply - initialSupply;

        // Mint remaining supply to reach max
        await arrow.mint(addr1.address, remainingSupply);

        // Try to mint again (should revert)
        const mintAmount = ethers.parseUnits("1", 18);
        await expect(arrow.mint(addr1.address, mintAmount))
            .to.be.revertedWith("Max supply reached");
    });

    it("Should pause and unpause transfers", async () => {
        const transferAmount = ethers.parseUnits("1", 18);
        
        // Pause the contract
        await arrow.pause();
        
        // Try to transfer while paused
        await expect(
            arrow.transfer(addr1.address, transferAmount)
        ).to.be.revertedWith("Pausable: paused");
        
        // Unpause and try transfer again
        await arrow.unpause();
        await arrow.transfer(addr1.address, transferAmount);
        
        expect(await arrow.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Should only allow owner to mint", async () => {
        const mintAmount = ethers.parseUnits("100", 18);
        await expect(
            arrow.connect(addr1).mint(addr1.address, mintAmount)
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow owner to pause", async () => {
        await expect(
            arrow.connect(addr1).pause()
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert on burn exceeding balance", async () => {
        await expect(arrow.connect(addr1).burn(ethers.parseUnits("1", 18)))
            .to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    it("Should prevent mint/burn during paused state", async () => {
        await arrow.pause();
        await expect(arrow.mint(addr1.address, 1)).to.be.revertedWith("Pausable: paused");
        await expect(arrow.connect(addr1).burn(1)).to.be.revertedWith("Pausable: paused");
    });

    it("Should approve via permit", async () => {
        const deadline = ethers.MaxUint256;
        const value = ethers.parseUnits("100", 18);
        const nonce = await arrow.nonces(owner.address);
        
        const domain = {
            name: await arrow.name(),
            version: "1",
            chainId: BigInt((await ethers.provider.getNetwork()).chainId),
            verifyingContract: await arrow.getAddress()
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

        await arrow.permit(
            owner.address,
            addr1.address,
            value,
            deadline,
            sig.v,
            sig.r,
            sig.s
        );
        
        expect(await arrow.allowance(owner.address, addr1.address)).to.equal(value);
    });

    it("Has correct metadata", async () => {
        expect(await arrow.name()).to.equal("ArrowSep.sol Token");
        expect(await arrow.symbol()).to.equal("ARR");
    });

    it("Blocks approve/transferFrom during pause", async () => {
        await arrow.pause();
        await expect(arrow.approve(addr1.address, 100)).to.be.revertedWith("Pausable: paused");
    });
});