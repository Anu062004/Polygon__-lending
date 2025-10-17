// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DebtToken
 * @dev Token that represents a user's debt in a lending pool
 * @notice DebtTokens track borrower debt shares and are updated on borrow, repay, and interest accrual
 */
contract DebtToken is ERC20, Ownable, ReentrancyGuard {
    // The underlying asset this debt token represents
    address public immutable underlyingAsset;
    
    // The lending pool that manages this debt token
    address public lendingPool;
    
    // Debt index (scaled by 1e18)
    uint256 public debtIndex;
    
    // Last update timestamp
    uint256 public lastUpdateTimestamp;
    
    // Events
    event DebtIndexUpdated(uint256 oldIndex, uint256 newIndex, uint256 timestamp);
    event LendingPoolUpdated(address oldPool, address newPool);

    /**
     * @dev Constructor
     * @param name_ Name of the debt token
     * @param symbol_ Symbol of the debt token
     * @param underlyingAsset_ Address of the underlying asset
     * @param initialOwner Initial owner of the contract
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address underlyingAsset_,
        address initialOwner
    ) ERC20(name_, symbol_) Ownable(initialOwner) {
        require(underlyingAsset_ != address(0), "Invalid underlying asset");
        underlyingAsset = underlyingAsset_;
        debtIndex = 1e18; // Start with index of 1
        lastUpdateTimestamp = block.timestamp;
    }

    /**
     * @dev Sets the lending pool address
     * @param _lendingPool Address of the lending pool
     * @notice Only the owner can call this function
     */
    function setLendingPool(address _lendingPool) external onlyOwner {
        require(_lendingPool != address(0), "Invalid lending pool address");
        address oldPool = lendingPool;
        lendingPool = _lendingPool;
        emit LendingPoolUpdated(oldPool, _lendingPool);
    }

    /**
     * @dev Updates the debt index
     * @param newIndex New debt index
     * @notice Only the lending pool can call this function
     */
    function updateDebtIndex(uint256 newIndex) external {
        require(msg.sender == lendingPool, "Only lending pool can update index");
        require(newIndex >= debtIndex, "Debt index cannot decrease");
        
        uint256 oldIndex = debtIndex;
        debtIndex = newIndex;
        lastUpdateTimestamp = block.timestamp;
        
        emit DebtIndexUpdated(oldIndex, newIndex, block.timestamp);
    }

    /**
     * @dev Mints debt tokens to a borrower
     * @param to Address to mint tokens to
     * @param amount Amount of underlying tokens being borrowed
     * @notice Only the lending pool can call this function
     */
    function mint(address to, uint256 amount) external nonReentrant returns (uint256) {
        require(msg.sender == lendingPool, "Only lending pool can mint");
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        // Calculate debt token amount based on current debt index
        uint256 debtTokenAmount = (amount * 1e18) / debtIndex;
        _mint(to, debtTokenAmount);
        return debtTokenAmount;
    }

    /**
     * @dev Burns debt tokens from a borrower
     * @param from Address to burn tokens from
     * @param amount Amount of underlying tokens being repaid
     * @return debtTokenAmount Amount of debt tokens burned
     * @notice Only the lending pool can call this function
     */
    function burn(address from, uint256 amount) external nonReentrant returns (uint256) {
        require(msg.sender == lendingPool, "Only lending pool can burn");
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        // Calculate debt token amount based on current debt index
        uint256 debtTokenAmount = (amount * 1e18) / debtIndex;
        require(balanceOf(from) >= debtTokenAmount, "Insufficient debt token balance");
        
        _burn(from, debtTokenAmount);
        return debtTokenAmount;
    }

    /**
     * @dev Gets the underlying debt amount for a given debt token amount
     * @param debtTokenAmount Amount of debt tokens
     * @return Amount of underlying debt
     */
    function getUnderlyingDebt(uint256 debtTokenAmount) external view returns (uint256) {
        return (debtTokenAmount * debtIndex) / 1e18;
    }

    /**
     * @dev Gets the debt token amount for a given underlying debt amount
     * @param underlyingDebt Amount of underlying debt
     * @return Amount of debt tokens
     */
    function getDebtTokenAmount(uint256 underlyingDebt) external view returns (uint256) {
        return (underlyingDebt * 1e18) / debtIndex;
    }

    /**
     * @dev Gets the current debt index
     * @return Current debt index
     */
    function getDebtIndex() external view returns (uint256) {
        return debtIndex;
    }

    /**
     * @dev Gets the last update timestamp
     * @return Last update timestamp
     */
    function getLastUpdateTimestamp() external view returns (uint256) {
        return lastUpdateTimestamp;
    }

    /**
     * @dev Gets the total underlying debt
     * @return Total underlying debt
     */
    function getTotalUnderlyingDebt() external view returns (uint256) {
        return (totalSupply() * debtIndex) / 1e18;
    }

    /**
     * @dev Gets the underlying debt for a specific user
     * @param user Address of the user
     * @return User's underlying debt
     */
    function getUnderlyingDebtOf(address user) external view returns (uint256) {
        return (balanceOf(user) * debtIndex) / 1e18;
    }

    /**
     * @dev Override decimals to match underlying asset
     * @return Number of decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return IERC20Metadata(underlyingAsset).decimals();
    }
}



