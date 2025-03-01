// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract LiquidityPoolTest is ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public token0;
    address public token1;
    uint256 public reserve0;
    uint256 public reserve1;

    constructor(address _token0, address _token1)
    ERC20(
        string(abi.encodePacked(IERC20Metadata(_token0).name(), "-", IERC20Metadata(_token1).name(), " LP")),
        string(abi.encodePacked(IERC20Metadata(_token0).symbol(), "-", IERC20Metadata(_token1).symbol(), " LP"))
    )
    ReentrancyGuard() {
        token0 = _token0;
        token1 = _token1;
        reserve0 = 0;
        reserve1 = 0;
    }

    function addLiquidity(uint256 amountA, uint256 amountB) external nonReentrant {
        uint256 _reserve0 = reserve0;
        uint256 _reserve1 = reserve1;

        if (_reserve0 > 0 && _reserve1 > 0) {
            require(amountA * _reserve1 >= _reserve0 * amountB - 1, "Ratio mismatch");
        }

        IERC20(token0).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(token1).safeTransferFrom(msg.sender, address(this), amountB);

        reserve0 = _reserve0 + amountA;
        reserve1 = _reserve1 + amountB;

        uint256 totalSupply = totalSupply();
        uint256 liquidity;
        if (totalSupply == 0) {
            liquidity = Math.sqrt(amountA * amountB);
        } else {
            liquidity = Math.min(amountA * totalSupply / _reserve0, amountB * totalSupply / _reserve1);
        }

        _mint(msg.sender, liquidity);

        emit AddLiquidity(msg.sender, amountA, amountB, liquidity);
        emit Sync(reserve0, reserve1);
    }

    function removeLiquidity(uint256 liquidity, uint256 amountAOutMin, uint256 amountBOutMin)
    external
    nonReentrant
    {
        require(liquidity > 0, "Invalid liquidity amount");
        require(liquidity <= balanceOf(msg.sender), "Insufficient LP tokens");

        uint256 totalSupply = totalSupply();
        uint256 amountA = liquidity * reserve0 / totalSupply;
        uint256 amountB = liquidity * reserve1 / totalSupply;

        require(amountA >= amountAOutMin, "AmountA below min");
        require(amountB >= amountBOutMin, "AmountB below min");

        reserve0 -= amountA;
        reserve1 -= amountB;

        _burn(msg.sender, liquidity);

        IERC20(token0).safeTransfer(msg.sender, amountA);
        IERC20(token1).safeTransfer(msg.sender, amountB);

        emit RemoveLiquidity(msg.sender, amountA, amountB, liquidity);
        emit Sync(reserve0, reserve1);
    }

    function swap(
        bool isToken0,
        uint256 amountIn,
        uint256 amountOutMin,
        address recipient
    )
    external
    nonReentrant
    {
        require(amountIn > 0, "Invalid amountIn");
        require(amountOutMin > 0, "Invalid amountOutMin");

        address tokenIn;
        address tokenOut;
        uint256 reserveIn;
        uint256 reserveOut;

        if (isToken0) {
            tokenIn = token0;
            tokenOut = token1;
            reserveIn = reserve0;
            reserveOut = reserve1;
        } else {
            tokenIn = token1;
            tokenOut = token0;
            reserveIn = reserve1;
            reserveOut = reserve0;
        }

        uint256 amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "Slippage");

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        if (isToken0) {
            reserve0 += amountIn;
            reserve1 -= amountOut;
        } else {
            reserve1 += amountIn;
            reserve0 -= amountOut;
        }

        IERC20(tokenOut).safeTransfer(recipient, amountOut);

        emit Swap(msg.sender, isToken0, amountIn, amountOut);
        emit Sync(reserve0, reserve1);
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
    public
    pure
    returns (uint256)
    {
        require(amountIn > 0, "Invalid input amount");
        require(reserveIn > 0 && reserveOut > 0, "Invalid reserves");

        uint256 fee = 3;
        uint256 amountInWithFee = amountIn * (1000 - fee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        return numerator / denominator;
    }

    event AddLiquidity(address indexed user, uint256 amountA, uint256 amountB, uint256 liquidity);
    event RemoveLiquidity(address indexed user, uint256 amountA, uint256 amountB, uint256 liquidity);
    event Swap(address indexed user, bool isToken0, uint256 amountIn, uint256 amountOut);
    event Sync(uint256 reserve0, uint256 reserve1);
}