import type { IgnitionModule } from '@nomicfoundation/ignition-core';
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

// Provide an explicit type for the exported module.
// If you have a generated type for the ArrowSep.sol contract (say, ArrowSep.sol),
// you can use that instead of unknown.
const deployArrowSepModule: IgnitionModule = buildModule('DeployArrowSep', (m) => {
  // Deploy the ArrowSep.sol contract
  const arrow = m.contract('ArrowSep');

  // Return the deployed contract instance
  return { arrow };
});

export default deployArrowSepModule;