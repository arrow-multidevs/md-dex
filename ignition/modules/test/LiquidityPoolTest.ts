import type { IgnitionModule } from '@nomicfoundation/ignition-core';
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

// Provide an explicit type for the exported module.
const deployLiquidityPoolTestModule: IgnitionModule = buildModule('DeployLiquidityPoolTest', (m) => {
  // Deploy the ArrowSep.sol and Multi contracts first (assuming they are already deployed)
  const arrowAddress = "0x8A5f1528B10680A7E02f6F8376600E29d7D3E7d2"; // Replace with the actual address of the deployed ArrowSep.sol contract
  const multiAddress = "0x477Ec9C23E124e33B2340c0aa6E215b09F02B85b"; // Replace with the actual address of the deployed Multi contract

  // Deploy the LiquidityPool contract
  const liquidityPool = m.contract('LiquidityPoolTest', [arrowAddress, multiAddress]);

  // Return the deployed contract instance
  return { liquidityPool };
});

export default deployLiquidityPoolTestModule;