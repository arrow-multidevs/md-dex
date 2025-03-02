// @ts-ignore
import { ethers } from "hardhat";
import { vars } from "hardhat/config";

import { LiquidityPoolTest, ArrowSep1, MultiSep } from '../typechain-types'
// import ethers from "ethers";

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

const getArrowSignedPool = (signer: any) => ethers.getContractAt("LiquidityPoolTest", LIQUIDITY_POOL_CONTRACT, signer);
const getMultiSignedPool = (signer: any) => ethers.getContractAt("LiquidityPoolTest", LIQUIDITY_POOL_CONTRACT, signer);

const getArrowTokenContract: (signer: any) => Promise<ArrowSep1> = (signer: any):Promise<ArrowSep1> => ethers.getContractAt("ArrowSep1", ARROW_TOKEN_CONTRACT, signer);
const getMultiTokenContract: (signer: any) => Promise<MultiSep>  = (signer: any):Promise<MultiSep> => ethers.getContractAt("MultiSep", MULTI_TOKEN_CONTRACT, signer);

async function checkPoolLiquidity(signer: any) {
    // Get the liquidity pool contract
    const pool: LiquidityPoolTest = await getArrowSignedPool(signer)

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

async function testAddLiquidity(signer: any, amountTokenA: string, amountTokenB: string): Promise<void> {
    // Get the liquidity pool contract
    const pool: LiquidityPoolTest = await getArrowSignedPool(signer);

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
}

async function testRemoveLiquidity(signer: any, liquidity: string, minAmountTokenA: string, minAmountTokenB: string): Promise<void> {
    // Get the liquidity pool contract
    const pool: LiquidityPoolTest = await getArrowSignedPool(signer);

    // Add Liquidity
    const removeLiquidityTx = await pool.connect(signer).removeLiquidity(parseEther(liquidity), parseEther(minAmountTokenA), parseEther(minAmountTokenB));
    await removeLiquidityTx.wait();
    console.log("Liquidity removed!");
}

async function testSwapping(signer: any): Promise<void> {

}

(async () => {
    // await testAddLiquidity(arrowSigner, "50", "70");

    await testRemoveLiquidity(arrowSigner, "49.4", "0", "0");

    await checkPoolLiquidity(arrowSigner);
})();