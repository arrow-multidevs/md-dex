// @ts-ignore
import { ethers } from "hardhat";
import { vars } from "hardhat/config";

import { LiquidityPoolTest, ArrowSep1, MultiSep } from '../typechain-types'
import { estimateAddLiquidity } from './supportFunctions';

const LIQUIDITY_POOL_CONTRACT = '0xc416744FC656b9b7a6b24835f0D571D135fffb6f';
const ARROW_TOKEN_CONTRACT = '0x8A5f1528B10680A7E02f6F8376600E29d7D3E7d2';
const MULTI_TOKEN_CONTRACT = '0x477Ec9C23E124e33B2340c0aa6E215b09F02B85b';

const WALLET_WITH_ARROW_TOKEN = '0xa2bd235edd948d175E7C4398076393cA5Fda2482';
const WALLET_WITH_MULTI_TOKEN = '0xD6C2916C5Cb5D7c155F3824C5fcc7588f01C83ee';

const { parseEther } = ethers;

const provider = ethers.provider;

// WALLET SIGNERS
const arrowSigner = new ethers.Wallet(vars.get('WALLET_ARROW_PRIVATE_KEY'), provider);
const multiSigner = new ethers.Wallet(vars.get('WALLET_HARIS_PRIVATE_KEY'), provider);

const getSignedPool = (signer: any) => ethers.getContractAt("LiquidityPoolTest", LIQUIDITY_POOL_CONTRACT, signer);

const getArrowTokenContract: (signer: any) => Promise<ArrowSep1> = (signer: any):Promise<ArrowSep1> => ethers.getContractAt("ArrowSep1", ARROW_TOKEN_CONTRACT, signer);
const getMultiTokenContract: (signer: any) => Promise<MultiSep>  = (signer: any):Promise<MultiSep> => ethers.getContractAt("MultiSep", MULTI_TOKEN_CONTRACT, signer);

async function checkPoolLiquidity(signer: any) {
    // Get the liquidity pool contract
    const pool: LiquidityPoolTest = await getSignedPool(signer)

    // Log the states of the pool contract
    const reserve0 = await pool.reserve0();
    const reserve1 = await pool.reserve1();
    const totalSupply = await pool.totalSupply();
    const lpBalance = await pool.balanceOf(signer.address);

    console.log(`Reserve0 (Token0): ${reserve0}`);
    console.log(`Reserve1 (Token1): ${reserve1}`);
    console.log(`Total LP Tokens Minted: ${totalSupply}`);
    console.log(`LP Tokens Balance for ${signer.address}: ${lpBalance}`);
}

async function testAddLiquidity(signer: any, amountTokenA: string, amountTokenB: string): Promise<{ liquidity: string; newReserve0: string; newReserve1: string }> {
    // Get the liquidity pool contract
    const pool: LiquidityPoolTest = await getSignedPool(signer);

    const { newReserve0, newReserve1, liquidity } = await estimateAddLiquidity(pool, amountTokenA, amountTokenB);

    console.log(`After adding Arrow: ${amountTokenA} and Multi: ${amountTokenB}.`)
    console.log(`You will get Liquidity: ${liquidity}, New Reserve will be Arrow: ${newReserve0}, Multi ${newReserve1}`);

    const arrow: ArrowSep1 = await getArrowTokenContract(signer);
    const multi: MultiSep = await getMultiTokenContract(signer);

    const approveArrow = await arrow.approve(pool.getAddress(), parseEther(amountTokenA));
    await approveArrow.wait();
    console.log("Arrow token approved!");

    const approveMulti = await multi.approve(pool.getAddress(), parseEther(amountTokenB));
    await approveMulti.wait();
    console.log("Multi token approved!");

    // Add Liquidity
    const addLiquidityTx = await pool.connect(signer).addLiquidity(parseEther(amountTokenA), parseEther(amountTokenB));
    await addLiquidityTx.wait();
    console.log("Liquidity added!");

    return { newReserve0, newReserve1, liquidity }
}

async function testRemoveLiquidity(signer: any, liquidity: string, minAmountTokenA: string, minAmountTokenB: string): Promise<void> {
    // Get the liquidity pool contract
    const pool: LiquidityPoolTest = await getSignedPool(signer);

    // Add Liquidity
    const removeLiquidityTx = await pool.connect(signer).removeLiquidity(parseEther(liquidity), parseEther(minAmountTokenA), parseEther(minAmountTokenB));
    await removeLiquidityTx.wait();
    console.log("Liquidity removed!");
}

async function calculateSwapDetails(
    pool: LiquidityPoolTest,
    amountIn: string,
    isToken0: boolean
  ): Promise<{ fee: string; amountOut: string }> {
  
    // Fetch current reserves (as bigint)
    const reserve0: bigint = await pool.reserve0();
    const reserve1: bigint = await pool.reserve1();
  
    // Determine reserves based on swap direction
    const reserveIn: bigint = isToken0 ? reserve0 : reserve1;
    const reserveOut: bigint = isToken0 ? reserve1 : reserve0;
  
    // Calculate the amount out using native BigInt arithmetic
    const amountInNum: bigint = parseEther(amountIn); // returns bigint
    const fee: bigint = 3n; // note the 'n' for bigint literal
    const amountInWithFee: bigint = amountInNum * (1000n - fee);
    const numerator: bigint = amountInWithFee * reserveOut;
    const denominator: bigint = reserveIn * 1000n + amountInWithFee;
    const amountOut: bigint = numerator / denominator;
  
    // Calculate the fee amount
    const feeAmount: bigint = (amountInNum * fee) / 1000n;
  
    // Format the fee and amount out to human-readable values
    const formattedFee = ethers.formatEther(feeAmount);
    const formattedAmountOut = ethers.formatEther(amountOut);
  
    return { fee: formattedFee, amountOut: formattedAmountOut };
  }

async function testSwapping(signer: any, isArrowToken: boolean, tokenIn: string, tokenOut: string, amountIn: string, recepient: string): Promise<void> {
    // Get the liquidity pool contract
    const pool: LiquidityPoolTest = await getSignedPool(signer);

    const { fee, amountOut: amountOutMin } = await calculateSwapDetails(pool, amountIn, isArrowToken);

    console.log("Calculations - Fee: ", fee, "Amount Out Min: ", amountOutMin);

    // Get the token contracts
    const tokenInContract = tokenIn === ARROW_TOKEN_CONTRACT
    ? await getArrowTokenContract(signer)
    : await getMultiTokenContract(signer);

    const tokenOutContract = tokenOut === ARROW_TOKEN_CONTRACT
    ? await getArrowTokenContract(signer)
    : await getMultiTokenContract(signer);

    // Approve the tokenIn to the pool
    const approveTx = await tokenInContract.approve(pool.getAddress(), ethers.parseEther(amountIn));
    await approveTx.wait();
    console.log(`${tokenIn === ARROW_TOKEN_CONTRACT ? "Arrow" : "Multi"} token approved!`);

    // Perform the swap
    const swapTx = await pool.connect(signer).swap(
        isArrowToken,
        ethers.parseEther(amountIn),
        ethers.parseEther(amountOutMin),
        signer.address
    );
    await swapTx.wait();
    console.log("Swap completed!");
}

async function estimateRemoveLiquidity(signer: any, liquidity: string): Promise<{ arrow: string, multi: string }> {
    const pool: LiquidityPoolTest = await getSignedPool(signer);
    const totalSupply = await pool.totalSupply();
    const liquidityAmt = parseEther(liquidity);

    const amountA = (liquidityAmt * (await pool.reserve0())) / totalSupply;
    const amountB = (liquidityAmt * (await pool.reserve1())) / totalSupply;

    return {
        arrow: ethers.formatEther(amountA),
        multi: ethers.formatEther(amountB)
    };
}

/*(async () => {
    // await testAddLiquidity(arrowSigner, "50", "70");
    // await testRemoveLiquidity(arrowSigner, "49.4", "0", "0");

    await testSwapping(multiSigner, false, MULTI_TOKEN_CONTRACT, ARROW_TOKEN_CONTRACT, "50", multiSigner.getAddress());

    await checkPoolLiquidity(arrowSigner);
})();*/

// Main execution sequence
(async () => {
    console.log("=== Before Starting Liquidity Pool Interaction ===\n");

    await checkPoolLiquidity(arrowSigner);

    console.log("\n=== Starting Liquidity Pool Interaction ===\n");

    // Step 1: Add initial liquidity
    console.log("\nAdding initial liquidity...");
    const { liquidity: addedLiquidity } = await testAddLiquidity(arrowSigner, "50", "70");
    console.log("\n=== After Adding Liquidity ===\n");
    await checkPoolLiquidity(arrowSigner);

    // Step 2: First swap (Multi → Arrow)
    console.log("\nSwapping 50 Multi for Arrow...");
    await testSwapping(multiSigner, false, MULTI_TOKEN_CONTRACT, ARROW_TOKEN_CONTRACT, "50", multiSigner.getAddress());
    console.log("\n=== After First Swap ===\n");
    await checkPoolLiquidity(multiSigner);

    // Step 3: Second swap (Arrow → Multi)
    console.log("\nSwapping 30 Arrow for Multi...");
    await testSwapping(arrowSigner, true, ARROW_TOKEN_CONTRACT, MULTI_TOKEN_CONTRACT, "30", arrowSigner.getAddress());
    console.log("\n=== After Second Swap ===\n");
    await checkPoolLiquidity(arrowSigner);

    // Step 4: Third swap (Multi → Arrow)
    console.log("\nSwapping 20 Multi for Arrow...");
    await testSwapping(multiSigner, false, MULTI_TOKEN_CONTRACT, ARROW_TOKEN_CONTRACT, "20", multiSigner.getAddress());
    console.log("\n=== After Third Swap ===\n");
    await checkPoolLiquidity(multiSigner);



    // Step 5: Remove liquidity
    const { arrow, multi } = await estimateRemoveLiquidity(arrowSigner, "50");

    console.log(`\nAfter removing you will get - Arrow: ${arrow} | Multi: ${multi}\n`);
    
    console.log("\nRemoving liquidity...\n");
    await testRemoveLiquidity(arrowSigner, addedLiquidity, "0", "0");
    console.log("\n=== After Removing Liquidity ===\n");
    await checkPoolLiquidity(arrowSigner);
})();