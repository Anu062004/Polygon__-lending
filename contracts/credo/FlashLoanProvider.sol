// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../LendingPool.sol";

/**
 * @title FlashLoanProvider
 * @dev Provides flash loan functionality for the Credo Protocol
 * @notice Allows uncollateralized loans for arbitrage and other DeFi operations
 */
contract FlashLoanProvider is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant FLASH_LOAN_FEE_BPS = 9; // 0.09% fee

    // Core components
    LendingPool public lendingPool;
    
    // Flash loan data
    struct FlashLoanData {
        address asset;
        uint256 amount;
        uint256 fee;
        address receiver;
        bytes params;
    }

    // Events
    event FlashLoanExecuted(
        address indexed receiver,
        address indexed asset,
        uint256 amount,
        uint256 fee
    );

    event FlashLoanFeeUpdated(uint256 newFeeBps);

    /**
     * @dev Constructor
     * @param _lendingPool Address of the lending pool
     * @param initialOwner Initial owner of the contract
     */
    constructor(address _lendingPool, address initialOwner) Ownable(initialOwner) {
        require(_lendingPool != address(0), "Invalid lending pool address");
        lendingPool = LendingPool(_lendingPool);
    }

    /**
     * @dev Executes a flash loan
     * @param asset Address of the asset to borrow
     * @param amount Amount to borrow
     * @param receiver Address to receive the loan
     * @param params Additional parameters for the receiver callback
     */
    function flashLoan(
        address asset,
        uint256 amount,
        address receiver,
        bytes calldata params
    ) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(receiver != address(0), "Invalid receiver address");
        require(lendingPool.supportedAssets(asset), "Asset not supported");

        // Calculate fee
        uint256 fee = (amount * FLASH_LOAN_FEE_BPS) / BASIS_POINTS;
        
        // Check if pool has sufficient liquidity
        require(lendingPool.totalSupplied(asset) >= amount, "Insufficient liquidity");

        // Store flash loan data
        FlashLoanData memory flashLoanData = FlashLoanData({
            asset: asset,
            amount: amount,
            fee: fee,
            receiver: receiver,
            params: params
        });

        // Transfer asset to receiver
        IERC20(asset).safeTransfer(receiver, amount);

        // Call receiver callback
        require(
            IFlashLoanReceiver(receiver).executeOperation(
                asset,
                amount,
                fee,
                params
            ),
            "Flash loan callback failed"
        );

        // Calculate total amount to repay (amount + fee)
        uint256 totalRepayAmount = amount + fee;

        // Transfer repayment from receiver
        IERC20(asset).safeTransferFrom(receiver, address(this), totalRepayAmount);

        // Transfer fee to protocol (if any)
        if (fee > 0) {
            // For now, keep fee in contract - can be distributed later
            // In production, this should be sent to a fee collector
        }

        emit FlashLoanExecuted(receiver, asset, amount, fee);
    }

    /**
     * @dev Batch flash loan execution
     * @param assets Array of asset addresses
     * @param amounts Array of amounts to borrow
     * @param receiver Address to receive the loans
     * @param params Additional parameters for the receiver callback
     */
    function flashLoanBatch(
        address[] calldata assets,
        uint256[] calldata amounts,
        address receiver,
        bytes calldata params
    ) external nonReentrant {
        require(assets.length == amounts.length, "Arrays length mismatch");
        require(assets.length > 0, "Empty arrays");
        require(receiver != address(0), "Invalid receiver address");

        uint256 totalFees = 0;
        
        // Transfer all assets to receiver
        for (uint256 i = 0; i < assets.length; i++) {
            require(amounts[i] > 0, "Amount must be greater than 0");
            require(lendingPool.supportedAssets(assets[i]), "Asset not supported");
            require(lendingPool.totalSupplied(assets[i]) >= amounts[i], "Insufficient liquidity");

            uint256 fee = (amounts[i] * FLASH_LOAN_FEE_BPS) / BASIS_POINTS;
            totalFees += fee;

            IERC20(assets[i]).safeTransfer(receiver, amounts[i]);
        }

        // Call receiver callback
        require(
            IFlashLoanReceiver(receiver).executeOperationBatch(
                assets,
                amounts,
                totalFees,
                params
            ),
            "Flash loan batch callback failed"
        );

        // Collect repayments
        for (uint256 i = 0; i < assets.length; i++) {
            uint256 fee = (amounts[i] * FLASH_LOAN_FEE_BPS) / BASIS_POINTS;
            uint256 totalRepayAmount = amounts[i] + fee;

            IERC20(assets[i]).safeTransferFrom(receiver, address(this), totalRepayAmount);

            emit FlashLoanExecuted(receiver, assets[i], amounts[i], fee);
        }
    }

    /**
     * @dev Updates the flash loan fee (only owner)
     * @param newFeeBps New fee in basis points
     */
    function updateFlashLoanFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Fee too high"); // Max 10%
        emit FlashLoanFeeUpdated(newFeeBps);
    }

    /**
     * @dev Withdraws accumulated fees (only owner)
     * @param asset Address of the asset to withdraw
     * @param amount Amount to withdraw
     */
    function withdrawFees(address asset, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(IERC20(asset).balanceOf(address(this)) >= amount, "Insufficient balance");
        
        IERC20(asset).safeTransfer(owner(), amount);
    }

    /**
     * @dev Gets the current flash loan fee
     * @return Fee in basis points
     */
    function getFlashLoanFee() external pure returns (uint256) {
        return FLASH_LOAN_FEE_BPS;
    }

    /**
     * @dev Calculates the fee for a given amount
     * @param amount Amount to calculate fee for
     * @return Fee amount
     */
    function calculateFee(uint256 amount) external pure returns (uint256) {
        return (amount * FLASH_LOAN_FEE_BPS) / BASIS_POINTS;
    }

    /**
     * @dev Gets the maximum flash loan amount for an asset
     * @param asset Address of the asset
     * @return Maximum amount available for flash loan
     */
    function getMaxFlashLoan(address asset) external view returns (uint256) {
        if (!lendingPool.supportedAssets(asset)) {
            return 0;
        }
        return lendingPool.totalSupplied(asset);
    }
}

/**
 * @title IFlashLoanReceiver
 * @dev Interface for flash loan receivers
 */
interface IFlashLoanReceiver {
    /**
     * @dev Executes operation after receiving flash loan
     * @param asset Address of the borrowed asset
     * @param amount Amount borrowed
     * @param fee Fee to be paid
     * @param params Additional parameters
     * @return True if operation successful
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 fee,
        bytes calldata params
    ) external returns (bool);

    /**
     * @dev Executes operation after receiving batch flash loan
     * @param assets Array of borrowed assets
     * @param amounts Array of borrowed amounts
     * @param fees Total fees to be paid
     * @param params Additional parameters
     * @return True if operation successful
     */
    function executeOperationBatch(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256 fees,
        bytes calldata params
    ) external returns (bool);
}
