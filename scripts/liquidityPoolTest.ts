// @ts-ignore
import { ethers } from "hardhat";
import { vars } from "hardhat/config";

import { LiquidityPoolTest, ArrowSep1, MultiSep } from '../typechain-types'
import {parseEther} from "ethers";

const LIQUIDITY_POOL_CONTRACT = '0xc416744FC656b9b7a6b24835f0D571D135fffb6f';
const ARROW_TOKEN_CONTRACT = '0x8A5f1528B10680A7E02f6F8376600E29d7D3E7d2';
const MULTI_TOKEN_CONTRACT = '0x477Ec9C23E124e33B2340c0aa6E215b09F02B85b';

const WALLET_WITH_ARROW_TOKEN = '0xa2bd235edd948d175E7C4398076393cA5Fda2482';
const WALLET_WITH_MULTI_TOKEN = '0xD6C2916C5Cb5D7c155F3824C5fcc7588f01C83ee';

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${vars.get('ALCHEMY_API_KEY')}`);

    const arrowSigner = new ethers.Wallet(vars.get('WALLET_ARROW_PRIVATE_KEY'), provider);
    const multiSigner = new ethers.Wallet(vars.get('WALLET_HARIS_PRIVATE_KEY'), provider);

    // Get the token contracts with the correct signers
    const arrow: ArrowSep1 = await ethers.getContractAt("ArrowSep1", ARROW_TOKEN_CONTRACT, arrowSigner);
    const multi: MultiSep = await ethers.getContractAt("MultiSep", MULTI_TOKEN_CONTRACT, multiSigner);

    // Get the liquidity pool contract
    const pool: LiquidityPoolTest = await ethers.getContractAt(
        "LiquidityPoolTest",
        LIQUIDITY_POOL_CONTRACT,
        arrowSigner // Use the same signer for simplicity, but you can use a different one if needed
    );

    // Approve the tokens for transfer from the respective wallets
    const approveArrow = await arrow.approve(pool.getAddress(), parseEther("100"));
    await approveArrow.wait();
    console.log("Arrow token approved!");

    const approveMulti = await multi.approve(pool.getAddress(), parseEther("200"));
    await approveMulti.wait();
    console.log("Multi token approved!");

    // Add liquidity using the signer that owns the tokens
    const addLiquidityTx = await pool.connect(arrowSigner).addLiquidity(parseEther("100"), parseEther("200"));
    await addLiquidityTx.wait();
    console.log("Liquidity added!");

    // Log the states of the contract
    const reserve0 = await pool.reserve0();
    const reserve1 = await pool.reserve1();
    const totalSupply = await pool.totalSupply();
    const lpBalance = await pool.balanceOf(arrowSigner.address);

    console.log(`Reserve0 (Token0): ${reserve0}`);
    console.log(`Reserve1 (Token1): ${reserve1}`);
    console.log(`Total LP Tokens Minted: ${totalSupply}`);
    console.log(`LP Tokens Balance for ${arrowSigner.address}: ${lpBalance}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});