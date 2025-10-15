// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PoolConfigurator
 * @dev Manages risk parameters for the lending pool
 * @notice Stores and manages LTV, liquidation threshold, liquidation bonus, and reserve factor
 */
contract PoolConfigurator is Ownable {
    // Risk parameters for each asset
    struct AssetConfig {
        uint256 ltv;                    // Loan-to-value ratio (in basis points)
        uint256 liquidationThreshold;   // Liquidation threshold (in basis points)
        uint256 liquidationBonus;       // Liquidation bonus (in basis points)
        uint256 reserveFactor;          // Reserve factor (in basis points)
        bool isActive;                  // Whether the asset is active
    }

    // Mapping from asset address to its configuration
    mapping(address => AssetConfig) public assetConfigs;
    
    // Events
    event AssetConfigUpdated(
        address indexed asset,
        uint256 ltv,
        uint256 liquidationThreshold,
        uint256 liquidationBonus,
        uint256 reserveFactor,
        bool isActive
    );
    
    event AssetActivated(address indexed asset, bool isActive);

    /**
     * @dev Constructor that sets the initial owner
     * @param initialOwner Initial owner of the contract
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Sets the configuration for an asset
     * @param asset Address of the asset
     * @param ltv Loan-to-value ratio in basis points
     * @param liquidationThreshold Liquidation threshold in basis points
     * @param liquidationBonus Liquidation bonus in basis points
     * @param reserveFactor Reserve factor in basis points
     * @param isActive Whether the asset is active
     * @notice Only the owner can call this function
     */
    function setAssetConfig(
        address asset,
        uint256 ltv,
        uint256 liquidationThreshold,
        uint256 liquidationBonus,
        uint256 reserveFactor,
        bool isActive
    ) external onlyOwner {
        require(asset != address(0), "Invalid asset address");
        require(ltv <= 10000, "LTV cannot exceed 100%");
        require(liquidationThreshold <= 10000, "Liquidation threshold cannot exceed 100%");
        require(liquidationThreshold >= ltv, "Liquidation threshold must be >= LTV");
        require(liquidationBonus >= 10000, "Liquidation bonus must be >= 100%");
        require(reserveFactor <= 10000, "Reserve factor cannot exceed 100%");
        
        assetConfigs[asset] = AssetConfig({
            ltv: ltv,
            liquidationThreshold: liquidationThreshold,
            liquidationBonus: liquidationBonus,
            reserveFactor: reserveFactor,
            isActive: isActive
        });
        
        emit AssetConfigUpdated(asset, ltv, liquidationThreshold, liquidationBonus, reserveFactor, isActive);
    }

    /**
     * @dev Activates or deactivates an asset
     * @param asset Address of the asset
     * @param isActive Whether the asset should be active
     * @notice Only the owner can call this function
     */
    function setAssetActive(address asset, bool isActive) external onlyOwner {
        require(asset != address(0), "Invalid asset address");
        require(assetConfigs[asset].ltv > 0, "Asset not configured");
        
        assetConfigs[asset].isActive = isActive;
        emit AssetActivated(asset, isActive);
    }

    /**
     * @dev Gets the configuration for an asset
     * @param asset Address of the asset
     * @return ltv Loan-to-value ratio
     * @return liquidationThreshold Liquidation threshold
     * @return liquidationBonus Liquidation bonus
     * @return reserveFactor Reserve factor
     * @return isActive Whether the asset is active
     */
    function getAssetConfig(address asset) external view returns (
        uint256 ltv,
        uint256 liquidationThreshold,
        uint256 liquidationBonus,
        uint256 reserveFactor,
        bool isActive
    ) {
        AssetConfig memory config = assetConfigs[asset];
        return (config.ltv, config.liquidationThreshold, config.liquidationBonus, config.reserveFactor, config.isActive);
    }

    /**
     * @dev Gets the LTV for an asset
     * @param asset Address of the asset
     * @return LTV in basis points
     */
    function getLTV(address asset) external view returns (uint256) {
        return assetConfigs[asset].ltv;
    }

    /**
     * @dev Gets the liquidation threshold for an asset
     * @param asset Address of the asset
     * @return Liquidation threshold in basis points
     */
    function getLiquidationThreshold(address asset) external view returns (uint256) {
        return assetConfigs[asset].liquidationThreshold;
    }

    /**
     * @dev Gets the liquidation bonus for an asset
     * @param asset Address of the asset
     * @return Liquidation bonus in basis points
     */
    function getLiquidationBonus(address asset) external view returns (uint256) {
        return assetConfigs[asset].liquidationBonus;
    }

    /**
     * @dev Gets the reserve factor for an asset
     * @param asset Address of the asset
     * @return Reserve factor in basis points
     */
    function getReserveFactor(address asset) external view returns (uint256) {
        return assetConfigs[asset].reserveFactor;
    }

    /**
     * @dev Checks if an asset is active
     * @param asset Address of the asset
     * @return True if the asset is active, false otherwise
     */
    function isAssetActive(address asset) external view returns (bool) {
        return assetConfigs[asset].isActive;
    }

    /**
     * @dev Checks if an asset is configured
     * @param asset Address of the asset
     * @return True if the asset is configured, false otherwise
     */
    function isAssetConfigured(address asset) external view returns (bool) {
        return assetConfigs[asset].ltv > 0;
    }
}



