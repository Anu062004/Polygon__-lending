// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AToken
 * @dev Interest-bearing token that represents a user's share in a lending pool
 * @notice ATokens are minted 1:1 on deposits and increase in value with interest
 */
contract AToken is ERC20, Ownable, ReentrancyGuard {
    // The underlying asset this aToken represents
    address public immutable underlyingAsset;
    
    // The lending pool that manages this aToken
    address public lendingPool;
    
    // Interest index (scaled by 1e18)
    uint256 public interestIndex;
    
    // Last update timestamp
    uint256 public lastUpdateTimestamp;
    
    // Events
    event InterestIndexUpdated(uint256 oldIndex, uint256 newIndex, uint256 timestamp);
    event LendingPoolUpdated(address oldPool, address newPool);

    /**
     * @dev Constructor
     * @param name_ Name of the aToken
     * @param symbol_ Symbol of the aToken
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
        interestIndex = 1e18; // Start with index of 1
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
     * @dev Updates the interest index
     * @param newIndex New interest index
     * @notice Only the lending pool can call this function
     */
    function updateInterestIndex(uint256 newIndex) external {
        require(msg.sender == lendingPool, "Only lending pool can update index");
        require(newIndex >= interestIndex, "Interest index cannot decrease");
        
        uint256 oldIndex = interestIndex;
        interestIndex = newIndex;
        lastUpdateTimestamp = block.timestamp;
        
        emit InterestIndexUpdated(oldIndex, newIndex, block.timestamp);
    }

    /**
     * @dev Mints aTokens to a user
     * @param to Address to mint tokens to
     * @param amount Amount of underlying tokens being deposited
     * @notice Only the lending pool can call this function
     */
    function mint(address to, uint256 amount) external nonReentrant returns (uint256) {
        require(msg.sender == lendingPool, "Only lending pool can mint");
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        // Calculate aToken amount based on current interest index
        uint256 aTokenAmount = (amount * 1e18) / interestIndex;
        _mint(to, aTokenAmount);
        return aTokenAmount;
    }

    /**
     * @dev Burns aTokens from a user
     * @param from Address to burn tokens from
     * @param amount Amount of underlying tokens being withdrawn
     * @return aTokenAmount Amount of aTokens burned
     * @notice Only the lending pool can call this function
     */
    function burn(address from, uint256 amount) external nonReentrant returns (uint256) {
        require(msg.sender == lendingPool, "Only lending pool can burn");
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        // Calculate aToken amount based on current interest index
        uint256 aTokenAmount = (amount * 1e18) / interestIndex;
        require(balanceOf(from) >= aTokenAmount, "Insufficient aToken balance");
        
        _burn(from, aTokenAmount);
        return aTokenAmount;
    }

    /**
     * @dev Gets the underlying asset amount for a given aToken amount
     * @param aTokenAmount Amount of aTokens
     * @return Amount of underlying assets
     */
    function getUnderlyingAmount(uint256 aTokenAmount) external view returns (uint256) {
        return (aTokenAmount * interestIndex) / 1e18;
    }

    /**
     * @dev Gets the aToken amount for a given underlying asset amount
     * @param underlyingAmount Amount of underlying assets
     * @return Amount of aTokens
     */
    function getATokenAmount(uint256 underlyingAmount) external view returns (uint256) {
        return (underlyingAmount * 1e18) / interestIndex;
    }

    /**
     * @dev Gets the current interest index
     * @return Current interest index
     */
    function getInterestIndex() external view returns (uint256) {
        return interestIndex;
    }

    /**
     * @dev Gets the last update timestamp
     * @return Last update timestamp
     */
    function getLastUpdateTimestamp() external view returns (uint256) {
        return lastUpdateTimestamp;
    }

    /**
     * @dev Override decimals to match underlying asset
     * @return Number of decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return IERC20Metadata(underlyingAsset).decimals();
    }
}



