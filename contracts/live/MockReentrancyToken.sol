// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./LiquidityPool.sol";

contract MockReentrancyToken is ERC20 {
    LiquidityPool public pool;

    constructor(address _pool) ERC20("Mock", "MCK") {
        pool = LiquidityPool(_pool);
    }

    function attackSwap() external {
        // Try to perform a reentrant swap during a transfer
        pool.swap(true, 1 ether, 0, address(this));
    }

    function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
        // During the transfer, try to perform another swap
        pool.swap(true, 1 ether, 0, address(this));
        return super.transferFrom(sender, recipient, amount);
    }
}