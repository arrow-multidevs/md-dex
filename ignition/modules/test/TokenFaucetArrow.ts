// @ts-ignore
import { ethers } from 'hardhat';

import type { IgnitionModule } from '@nomicfoundation/ignition-core';
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

// Provide an explicit type for the exported module.
const deployTokenFaucetArrowModule: IgnitionModule = buildModule('DeployTokenFaucetArrow', (m) => {
  // Replace with the actual deployed token address and configuration
  const tokenAddress = '0x8A5f1528B10680A7E02f6F8376600E29d7D3E7d2'; // E.g., Arrow or Multi token address
  const maxClaimAmount = ethers.parseEther("10").toString(); // 10 token (adjust as needed)
  const claimInterval = 86400; // 1 day in seconds

  // Deploy the TokenFaucet contract
  const tokenFaucet = m.contract('TokenFaucetArrow', [
    tokenAddress,
    maxClaimAmount,
    claimInterval
  ]);

  // Return the deployed contract instance
  return { tokenFaucet };
});

export default deployTokenFaucetArrowModule;

// 0x6837443aA73df8883c7b6c8c1139bE54e8346b65