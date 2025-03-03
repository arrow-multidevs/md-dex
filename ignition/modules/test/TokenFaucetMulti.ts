// @ts-ignore
import { ethers } from 'hardhat';

import type { IgnitionModule } from '@nomicfoundation/ignition-core';
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

// Provide an explicit type for the exported module.
const deployTokenFaucetMultiModule: IgnitionModule = buildModule('DeployTokenFaucetMulti', (m) => {
  // Replace with the actual deployed token address and configuration
  const tokenAddress = '0x477Ec9C23E124e33B2340c0aa6E215b09F02B85b'; // E.g., Arrow or Multi token address
  const maxClaimAmount = ethers.parseEther("10").toString(); // 10 token (adjust as needed)
  const claimInterval = 86400; // 1 day in seconds

  // Deploy the TokenFaucet contract
  const tokenFaucet = m.contract('TokenFaucetMulti', [
    tokenAddress,
    maxClaimAmount,
    claimInterval
  ]);

  // Return the deployed contract instance
  return { tokenFaucet };
});

export default deployTokenFaucetMultiModule;

// 0x96D2e792282e5300499a0Fe2d3343084B976E0fd