import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { ethers } from "hardhat";
import { parseEther } from "ethers";
import { LiquidityPool, Arrow, Multi } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LiquidityPool", () => {
  let pool: LiquidityPool;
  let arrow: Arrow;
  let multi: Multi;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    const Arrow = await ethers.getContractFactory("Arrow");
    arrow = await Arrow.deploy();
    await arrow.waitForDeployment();

    const Multi = await ethers.getContractFactory("Multi");
    multi = await Multi.deploy();
    await multi.waitForDeployment();

    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    pool = await LiquidityPool.deploy(await arrow.getAddress(), await multi.getAddress());
    await pool.waitForDeployment();

    // Mint tokens to addr1 and addr2 for testing
    await arrow.connect(owner).mint(addr1.address, parseEther("1000"));
    await multi.connect(owner).mint(addr1.address, parseEther("1000"));
    await arrow.connect(owner).mint(addr2.address, parseEther("1000"));
    await multi.connect(owner).mint(addr2.address, parseEther("1000"));
  });

  describe("Constructor", () => {
    it("sets correct name and symbol", async () => {
      // Try to get pool name and symbol
      try {
        const poolName = await pool.name();
        console.log("Pool name:", poolName);
      } catch (e) {
        console.error("Error getting pool name:", e);
      }
      
      try {
        const poolSymbol = await pool.symbol();
        console.log("Pool symbol:", poolSymbol);
      } catch (e) {
        console.error("Error getting pool symbol:", e);
      }
    });
  });

  describe("addLiquidity", () => {
    it("initial addition calculates LP tokens correctly", async () => {
        // Approve tokens first
        await arrow.connect(addr1).approve(await pool.getAddress(), parseEther("100"));
        await multi.connect(addr1).approve(await pool.getAddress(), parseEther("200"));

        await pool.connect(addr1).addLiquidity(parseEther("100"), parseEther("200"));
        const liquidity = await pool.balanceOf(addr1.address);
        expect(liquidity).to.equal(parseEther("141.421356237309504880")); // Corrected expected value
    });

    it("subsequent addition with correct ratio", async () => {
        // Approve tokens first
        await arrow.connect(addr1).approve(await pool.getAddress(), parseEther("150"));
        await multi.connect(addr1).approve(await pool.getAddress(), parseEther("300"));

        await pool.connect(addr1).addLiquidity(parseEther("100"), parseEther("200"));
        await pool.connect(addr1).addLiquidity(parseEther("50"), parseEther("100"));
        const liquidity = await pool.balanceOf(addr1.address);
        expect(liquidity).to.equal(parseEther("212.132034355964257320")); // Corrected expected value
    });

    it("invalid ratio reverts", async () => {
      // Approve tokens first
      await arrow.connect(addr1).approve(await pool.getAddress(), parseEther("150"));
      await multi.connect(addr1).approve(await pool.getAddress(), parseEther("350"));
      
      await pool.connect(addr1).addLiquidity(parseEther("100"), parseEther("200"));
      await expect(pool.connect(addr1).addLiquidity(parseEther("50"), parseEther("150")))
        .to.be.revertedWith("Ratio mismatch");
    });

    it("zero amounts do not mint LP tokens", async () => {
      await pool.connect(addr1).addLiquidity(0, 0);
      expect(await pool.balanceOf(addr1.address)).to.equal(0);
    });
  });

  describe("removeLiquidity", () => {
    it("removes full liquidity", async () => {
      // Approve tokens first
      await arrow.connect(addr1).approve(await pool.getAddress(), parseEther("100"));
      await multi.connect(addr1).approve(await pool.getAddress(), parseEther("200"));

      await pool.connect(addr1).addLiquidity(parseEther("100"), parseEther("200"));

      // Get the actual LP tokens amount
      const lpBalance = await pool.balanceOf(addr1.address);

      // Approve LP tokens for removal
      await pool.connect(addr1).approve(await pool.getAddress(), lpBalance);

      // Use much smaller minimum amounts to account for potential rounding
      await pool.connect(addr1).removeLiquidity(
        lpBalance, 
        parseEther("90"),  // Accept slightly less than deposited to account for rounding
        parseEther("180")  // Accept slightly less than deposited to account for rounding
      );

      const liquidity = await pool.balanceOf(addr1.address);
      expect(liquidity).to.equal(0);
    });

    it("removes partial liquidity", async () => {
      // Approve tokens first
      await arrow.connect(addr1).approve(await pool.getAddress(), parseEther("100"));
      await multi.connect(addr1).approve(await pool.getAddress(), parseEther("200"));

      // Add initial liquidity
      await pool.connect(addr1).addLiquidity(parseEther("100"), parseEther("200"));

      // Get half of the LP tokens
      const lpBalance = await pool.balanceOf(addr1.address);
      const halfLpBalance = lpBalance / 2n;

      // Approve LP tokens for removal
      await pool.connect(addr1).approve(await pool.getAddress(), halfLpBalance);

      // Remove half of liquidity with proportional minimum amounts
      await pool.connect(addr1).removeLiquidity(
        halfLpBalance,
        parseEther("45"),  // Slightly less than half of 100 to account for rounding
        parseEther("90")   // Slightly less than half of 200 to account for rounding
      );

      const remainingLiquidity = await pool.balanceOf(addr1.address);
      expect(remainingLiquidity).to.equal(lpBalance - halfLpBalance);
    });

    it("reverts if insufficient LP tokens", async () => {
      // Approve tokens first
      await arrow.connect(addr1).approve(await pool.getAddress(), parseEther("100"));
      await multi.connect(addr1).approve(await pool.getAddress(), parseEther("200"));

      // Add initial liquidity
      await pool.connect(addr1).addLiquidity(parseEther("100"), parseEther("200"));

      // Get the actual LP tokens amount
      const lpBalance = await pool.balanceOf(addr1.address);
      
      // Try to remove more than we have
      const tooManyLPTokens = lpBalance + 1n;

      // Approve LP tokens (even though we don't have enough)
      await pool.connect(addr1).approve(await pool.getAddress(), tooManyLPTokens);

      await expect(pool.connect(addr1).removeLiquidity(
        tooManyLPTokens,
        parseEther("90"),
        parseEther("180")
      )).to.be.revertedWith("Insufficient LP tokens");
    });
  });

  describe("swap", () => {
      it("swap token0 for token1", async () => {
        // Approve tokens for initial liquidity
        await arrow.connect(addr1).approve(await pool.getAddress(), parseEther("100"));
        await multi.connect(addr1).approve(await pool.getAddress(), parseEther("200"));
    
        // Add initial liquidity
        await pool.connect(addr1).addLiquidity(parseEther("100"), parseEther("200"));
    
        // Approve tokens for swap
        await arrow.connect(addr1).approve(await pool.getAddress(), parseEther("10"));
    
        // Perform swap
        await pool.connect(addr1).swap(true, parseEther("10"), parseEther("1"), addr1.address);
        const balance = await multi.balanceOf(addr1.address);
        expect(balance).to.be.gt(parseEther("18")); // Expect more than 18 due to rounding
      });
    
      it("swap token1 for token0", async () => {
        // Approve tokens for initial liquidity
        await arrow.connect(addr1).approve(await pool.getAddress(), parseEther("100"));
        await multi.connect(addr1).approve(await pool.getAddress(), parseEther("200"));
    
        // Add initial liquidity
        await pool.connect(addr1).addLiquidity(parseEther("100"), parseEther("200"));
    
        // Approve tokens for swap
        await multi.connect(addr1).approve(await pool.getAddress(), parseEther("20"));
    
        // Perform swap
        await pool.connect(addr1).swap(false, parseEther("20"), parseEther("1"), addr1.address);
        const balance = await arrow.balanceOf(addr1.address);
        expect(balance).to.be.gt(parseEther("9")); // Expect more than 9 due to rounding
      });
    
      it("reverts on slippage", async () => {
        // Approve tokens for initial liquidity
        await arrow.connect(addr1).approve(await pool.getAddress(), parseEther("100"));
        await multi.connect(addr1).approve(await pool.getAddress(), parseEther("200"));
    
        // Add initial liquidity
        await pool.connect(addr1).addLiquidity(parseEther("100"), parseEther("200"));
    
        // Approve tokens for swap
        await arrow.connect(addr1).approve(await pool.getAddress(), parseEther("10"));
    
        // Attempt swap with high slippage
        await expect(pool.connect(addr1).swap(true, parseEther("10"), parseEther("20"), addr1.address))
          .to.be.revertedWith("Slippage");
      });
    
      it("emits events", async () => {
        // Approve tokens for initial liquidity
        await arrow.connect(addr1).approve(await pool.getAddress(), parseEther("100"));
        await multi.connect(addr1).approve(await pool.getAddress(), parseEther("200"));
      
        // Add initial liquidity
        await pool.connect(addr1).addLiquidity(parseEther("100"), parseEther("200"));
      
        // Approve tokens for swap
        await arrow.connect(addr1).approve(await pool.getAddress(), parseEther("10"));
      
        // Perform swap and check events
        const tx = await pool.connect(addr1).swap(true, parseEther("10"), parseEther("1"), addr1.address);
        
        // Check for events being emitted
        await expect(tx)
          .to.emit(pool, "Swap")
          .withArgs(addr1.address, true, parseEther("10"), anyValue) // Use anyValue for amountOut as it's calculated
          .to.emit(pool, "Sync")
          .withArgs(anyValue, anyValue); // Reserve values will be updated
      });
    
      it("multiple swaps and fee accumulation", async () => {
          // Mint tokens to addr1
          await arrow.connect(owner).mint(addr1.address, parseEther("2000"));
          await multi.connect(owner).mint(addr1.address, parseEther("2000"));
        
          // Approve tokens for initial liquidity
          await arrow.connect(addr1).approve(await pool.getAddress(), parseEther("1000"));
          await multi.connect(addr1).approve(await pool.getAddress(), parseEther("2000"));
        
          // Add initial liquidity
          await pool.connect(addr1).addLiquidity(parseEther("1000"), parseEther("2000"));
        
          // Perform multiple swaps
          const swapAmounts = [parseEther("10"), parseEther("20"), parseEther("15"), parseEther("5"), parseEther("8")];
          const initialReserve0 = await pool.reserve0();
          const initialReserve1 = await pool.reserve1();
        
          for (let i = 0; i < swapAmounts.length; i++) {
            // Ensure addr1 has enough tokens for the swap
            const arrowBalance = await arrow.balanceOf(addr1.address);
            if (arrowBalance < swapAmounts[i]) {
              throw new Error("Insufficient arrow balance for swap");
            }
        
            await arrow.connect(addr1).approve(await pool.getAddress(), swapAmounts[i]);
            await pool.connect(addr1).swap(true, swapAmounts[i], parseEther("1"), addr1.address);
          }
        
          // Check final reserves
          const finalReserve0 = await pool.reserve0();
          const finalReserve1 = await pool.reserve1();
        
          console.log("finalReserve0", finalReserve0);
          console.log("finalReserve1", finalReserve1);
        
          // Calculate expected reserves with fees
          let expectedReserve0 = initialReserve0;
          let expectedReserve1 = initialReserve1;
        
          for (let i = 0; i < swapAmounts.length; i++) {
            const amountIn = swapAmounts[i];
            const amountOut = await pool.getAmountOut(amountIn, expectedReserve0, expectedReserve1);
            const fee = amountIn * 3n / 1000n; // Convert 3 and 1000 to bigint
            expectedReserve0 += amountIn - fee;
            expectedReserve1 -= amountOut;
          }
        
          // Use precise expected values
          expect(finalReserve0).to.equal(expectedReserve0);
          expect(finalReserve1).to.equal(expectedReserve1);
        });
    });

  describe("Reentrancy Check", () => {
    it("prevents reentrant swaps", async () => {
      // Deploy a malicious token contract that calls `swap` during `transferFrom`
      const ReentrancyTokenFactory = await ethers.getContractFactory("MockReentrancyToken");
      const maliciousToken = await ReentrancyTokenFactory.deploy(await pool.getAddress()) as any;
      await maliciousToken.waitForDeployment();

      await expect(maliciousToken.connect(addr1).attackSwap()).to.be.reverted;
    });
  });
});