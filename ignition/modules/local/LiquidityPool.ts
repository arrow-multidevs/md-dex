import type { IgnitionModule } from '@nomicfoundation/ignition-core';
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

// Provide an explicit type for the exported module.
const deployLiquidityPoolModule: IgnitionModule = buildModule('DeployLiquidityPool', (m) => {
  // Deploy the Arrow and Multi contracts first (assuming they are already deployed)
  const arrowAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with the actual address of the deployed Arrow contract
  const multiAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Replace with the actual address of the deployed Multi contract

  // Deploy the LiquidityPool contract
  const liquidityPool = m.contract('LiquidityPool', [arrowAddress, multiAddress]);

  // Return the deployed contract instance
  return { liquidityPool };
});

export default deployLiquidityPoolModule;