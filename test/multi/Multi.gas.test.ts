// test/gas/ArrowSep.sol.gas.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { Multi } from "../../typechain-types";

const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Update with your deployed address

describe("Gas Efficiency - Multi Token (Existing Deployment)", () => {
  let multi: Multi;
  let owner: any;
  let addr1: any;

  beforeEach(async () => {
    // Connect to existing signers
    [owner, addr1] = await ethers.getSigners();
    multi = (await ethers.getContractAt("Multi", CONTRACT_ADDRESS)) as Multi;
  });

  it("should mint tokens with low gas", async () => {
    // Ensure receiver is valid
    const amount = ethers.parseUnits("100", 18);
    const mintTx = await multi.connect(owner).mint(addr1.address, amount);
    await mintTx.wait();
  });

  it("should burn tokens with low gas", async () => {
    // Mint tokens first
    const initialAmount = ethers.parseUnits("1000", 18);
    await multi.connect(owner).mint(owner.address, initialAmount);

    // Burn half the tokens
    const burnTx = await multi.connect(owner).burn(ethers.parseUnits("500", 18));
    await burnTx.wait();
  });

  it("should transfer tokens with low gas", async () => {
    // Mint tokens to owner
    const amount = ethers.parseUnits("1000", 18);
    await multi.connect(owner).mint(owner.address, amount);

    // Transfer to addr1
    const transferTx = await multi.connect(owner).transfer(addr1.address, amount);
    await transferTx.wait();
  });

  it("should pause transfers with low gas", async () => {
    const pauseTx = await multi.connect(owner).pause();
    await pauseTx.wait();
  });

  it("should unpause transfers with low gas", async () => {
    // Pause first
    await multi.connect(owner).pause();

    // Unpause
    const unpauseTx = await multi.connect(owner).unpause();
    await unpauseTx.wait();
  });

  it("should approve allowance with low gas", async () => {
    const approveTx = await multi.connect(owner).approve(addr1.address, ethers.parseUnits("100", 18));
    await approveTx.wait();
  });
});