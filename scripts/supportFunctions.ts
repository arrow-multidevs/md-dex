// @ts-ignore
import { ethers } from "hardhat";
import { LiquidityPoolTest } from '../typechain-types'

// Babylonian algorithm for sqrt using native bigint arithmetic
export function sqrtBabylonian(y: bigint): bigint {
    if (y === 0n) return y;
    let z = (y + 1n) / 2n;
    let result = y;
    while (z < result) {
      result = z;
      const temp = y / z;
      z = (temp + z) / 2n;
    }
    return result;
  }

  export async function estimateAddLiquidity(
    pool: LiquidityPoolTest,
    amountA: string,
    amountB: string
  ): Promise<{ liquidity: string; newReserve0: string; newReserve1: string }> {
    const reserve0: bigint = await pool.reserve0(); // native bigint
    const reserve1: bigint = await pool.reserve1();
    const totalSupply: bigint = await pool.totalSupply();
  
    // Convert human-readable amounts to bigints (Wei)
    const amountAIn: bigint = ethers.parseEther(amountA);
    const amountBIn: bigint = ethers.parseEther(amountB);
  
    let liquidity: bigint;
  
    if (totalSupply === 0n) {
      // Calculate liquidity for a new pool using sqrt
      const product = amountAIn * amountBIn;
      liquidity = sqrtBabylonian(product);
    } else {
      // Calculate liquidity for an existing pool using the minimum ratio
      const ratioA = (amountAIn * totalSupply) / reserve0;
      const ratioB = (amountBIn * totalSupply) / reserve1;
      liquidity = ratioA < ratioB ? ratioA : ratioB;
    }
  
    // Calculate new reserves
    const newReserve0 = reserve0 + amountAIn;
    const newReserve1 = reserve1 + amountBIn;
  
    // Format results into human-readable strings
    return {
      liquidity: ethers.formatEther(liquidity),
      newReserve0: ethers.formatEther(newReserve0),
      newReserve1: ethers.formatEther(newReserve1),
    };
  }