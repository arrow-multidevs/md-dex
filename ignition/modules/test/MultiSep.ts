import type { IgnitionModule } from '@nomicfoundation/ignition-core';
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const deployMultiSepModule: IgnitionModule = buildModule('DeployMultiSep', (m) => {
  const multi = m.contract('MultiSep');

  return { multi };
});

export default deployMultiSepModule;