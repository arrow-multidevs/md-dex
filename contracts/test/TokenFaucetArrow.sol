// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenFaucetArrow {
    IERC20 public token;
    uint256 public maxClaimAmount; // Maximum tokens per claim
    uint256 public claimInterval; // Seconds between claims (e.g., 86400 = 1 day)
    mapping(address => uint256) public lastClaimTime; // Tracks last claim time for users

    address private owner; // Contract owner (for administrative functions)

    constructor(
        address _token, 
        uint256 _maxClaim, 
        uint256 _interval
    ) {
        require(_token != address(0), "Invalid token address");
        require(_maxClaim > 0, "Max claim must be positive");
        require(_interval > 0, "Interval must be positive");
        
        token = IERC20(_token);
        maxClaimAmount = _maxClaim;
        claimInterval = _interval;
        owner = msg.sender; // Set deployer as initial owner
    }

    // Function for users to claim tokens
    function claimTokens() external {
        require(token.balanceOf(address(this)) >= maxClaimAmount, "Faucet empty");
        require(lastClaimTime[msg.sender] + claimInterval <= block.timestamp, "Wait between claims");
        
        require(token.transfer(msg.sender, maxClaimAmount), "Token transfer failed");
        
        // Update last claim time
        lastClaimTime[msg.sender] = block.timestamp;
    }

    // Function for owner to withdraw remaining tokens
    function withdrawTokens(uint256 amount, address receiver) external onlyOwner {
        require(token.balanceOf(address(this)) >= amount, "Insufficient balance");
        require(token.transfer(receiver, amount), "Withdrawal failed");
    }

    // Ownership management functions
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner address");
        owner = newOwner;
    }
}