import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

// Define the deployment module for the Arrow token
export default buildModule('DeployArrow', (m) => {
  // Deploy the Arrow contract
  const arrow = m.contract('Arrow');

  // Return the deployed contract instance
  return { arrow };
});