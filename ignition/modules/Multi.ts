import type { IgnitionModule } from '@nomicfoundation/ignition-core';
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

// Provide an explicit type for the exported module.
// If you have a generated type for the Arrow contract (say, Arrow),
// you can use that instead of unknown.
const deployArrowModule: IgnitionModule = buildModule('DeployMulti', (m) => {
  // Deploy the Arrow contract
  const multi = m.contract('Multi');

  // Return the deployed contract instance
  return { multi };
});

export default deployArrowModule;