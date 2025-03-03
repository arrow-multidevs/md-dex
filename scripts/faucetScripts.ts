// @ts-ignore
import { ethers } from "hardhat";
import { vars } from "hardhat/config";

import { TokenFaucetArrow } from '../typechain-types'


const { parseEther, provider } = ethers;

const ARROW_TOKEN_CONTRACT = '0x8A5f1528B10680A7E02f6F8376600E29d7D3E7d2';
const ARROW_TOKEN_FAUCET_CONTRACT = '0x6837443aA73df8883c7b6c8c1139bE54e8346b65';

// WALLET SIGNERS
const arrowSigner = new ethers.Wallet(vars.get('WALLET_ARROW_PRIVATE_KEY'), provider);
const multiSigner = new ethers.Wallet(vars.get('WALLET_HARIS_PRIVATE_KEY'), provider);
const faucetWalletSigner = new ethers.Wallet("43753e86ceed08ee616948f31128f8a077a595033abcaafd929bea9dd97c43e9", provider);

// Add this function to your script
async function fundFaucet(signer: any, tokenAddress: string, faucetAddress: string, amount: string) {
    // Get the token contract (e.g., ArrowSep1)
    const tokenContract = await ethers.getContractAt("ArrowSep1", tokenAddress, signer);

    // Mint tokens to the faucet (if minting is required)
    // const mintTx = await tokenContract.mint(faucetAddress, parseEther(amount));
    // await mintTx.wait();

    // Transfer existing tokens to the faucet
    const transferTx = await tokenContract.transfer(faucetAddress, parseEther(amount));
    await transferTx.wait();

    console.log(`Transferred ${amount} tokens to faucet at ${faucetAddress}`);
}

async function claimFromFaucet(signer: any) {
    const faucet: TokenFaucetArrow = await ethers.getContractAt("TokenFaucetArrow", ARROW_TOKEN_FAUCET_CONTRACT, signer);

    const tx = await faucet.claimTokens();
    await tx.wait();

    console.log("Tokens Claimed");
}

(async () => {
    // await fundFaucet(arrowSigner, ARROW_TOKEN_CONTRACT, ARROW_TOKEN_FAUCET, "10");

    await claimFromFaucet(faucetWalletSigner);
})();