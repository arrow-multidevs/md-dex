// test/gas/ArrowSep.sol.gas.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { Arrow } from "../../typechain-types";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Update with your deployed address

describe("Gas Efficiency - ArrowSep.sol Token (Existing Deployment)", () => {
  let arrow: Arrow;
  let owner: any;
  let addr1: any;

  beforeEach(async () => {
    // Connect to existing signers
    [owner, addr1] = await ethers.getSigners();
    arrow = (await ethers.getContractAt("Arrow", CONTRACT_ADDRESS)) as Arrow;
  });

  it("should mint tokens with low gas", async () => {
    // Ensure receiver is valid
    const amount = ethers.parseUnits("100", 18);
    const mintTx = await arrow.connect(owner).mint(addr1.address, amount);
    await mintTx.wait();
  });

  it("should burn tokens with low gas", async () => {
    // Mint tokens first
    const initialAmount = ethers.parseUnits("1000", 18);
    await arrow.connect(owner).mint(owner.address, initialAmount);

    // Burn half the tokens
    const burnTx = await arrow.connect(owner).burn(ethers.parseUnits("500", 18));
    await burnTx.wait();
  });

  it("should transfer tokens with low gas", async () => {
    // Mint tokens to owner
    const amount = ethers.parseUnits("1000", 18);
    await arrow.connect(owner).mint(owner.address, amount);

    // Transfer to addr1
    const transferTx = await arrow.connect(owner).transfer(addr1.address, amount);
    await transferTx.wait();
  });

  it("should pause transfers with low gas", async () => {
    const pauseTx = await arrow.connect(owner).pause();
    await pauseTx.wait();
  });

  it("should unpause transfers with low gas", async () => {
    // Pause first
    await arrow.connect(owner).pause();

    // Unpause
    const unpauseTx = await arrow.connect(owner).unpause();
    await unpauseTx.wait();
  });

  it("should approve allowance with low gas", async () => {
    const approveTx = await arrow.connect(owner).approve(addr1.address, ethers.parseUnits("100", 18));
    await approveTx.wait();
  });

  /*it("should use permit with low gas", async () => {
    // Generate permit parameters
    const ownerAddress = owner.address;
    const spender = addr1.address;
    const value = ethers.parseUnits("100", 18);
    const deadline = ethers.constants.MaxUint256;

    const domain = {
      name: await arrow.name(),
      version: "1",
      chainId: await ethers.provider.getNetwork().then((net) => net.chainId),
      verifyingContract: arrow.address,
    };

    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const currentNonce = await arrow.nonces(owner.address);
    const message = {
      owner: ownerAddress,
      spender: spender,
      value: value,
      nonce: currentNonce.toNumber(),
      deadline: deadline,
    };

    // Sign the permit message
    const signature = await owner._signTypedData(domain, types, message);

    // Execute permit
    const permitTx = await arrow
      .connect(owner)
      .permit(ownerAddress, spender, value, deadline, signature);
    await permitTx.wait();
  });*/
});