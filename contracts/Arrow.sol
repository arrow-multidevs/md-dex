// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract Arrow is ERC20Permit, Ownable, Pausable {
    uint256 public constant MAX_SUPPLY = 100000e18;

    // Custom Events
    event Mint(address indexed owner, address indexed to, uint256 amount);
    event Burn(address indexed account, uint256 amount);
    event MaxSupplyReached();

    // Set token-specific parameters in constructor
    constructor() ERC20("Arrow Token", "ARR") ERC20Permit("Arrow Token") {
        uint256 initialSupply = 50000 * (10 ** decimals());
        require(initialSupply <= MAX_SUPPLY, "Initial supply exceeds max supply");
        _mint(msg.sender, initialSupply);
    }

    // ---- ACCESS CONTROL ----
    function mint(address to, uint256 amount)
    public
    onlyOwner
    {
        require(to != address(0) && amount > 0, "Invalid parameters");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply reached");
        _mint(to, amount);
        emit Mint(msg.sender, to, amount); // Emit Mint event

        // Check if max supply has been reached after minting
        if (totalSupply() == MAX_SUPPLY) {
            emit MaxSupplyReached(); // Emit MaxSupplyReached event
        }
    }

    function burn(uint256 amount)
    public
    {
        _burn(msg.sender, amount);
        emit Burn(msg.sender, amount); // Emit Burn event
    }

    // ---- PAUSE / UNPAUSE ----
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // ---- OVERRIDDEN TOKEN LOGIC ----
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal whenNotPaused virtual override(ERC20) {
        super._beforeTokenTransfer(from, to, amount);
    }

    function approve(address spender, uint256 amount) public whenNotPaused virtual override returns (bool) {
        return super.approve(spender, amount);
    }

    // ---- DEFAULT ERC20 PARAMETERS ----
    function decimals() public view virtual override returns (uint8) {
        return 18; // Can be adjusted as needed
    }
}