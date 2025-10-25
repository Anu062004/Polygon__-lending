// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../LendingPool.sol";
import "./CredoToken.sol";

/**
 * @title RewardDistributor
 * @dev Distributes rewards to lenders and borrowers in the Credo Protocol
 * @notice Manages reward distribution based on user activity and protocol performance
 */
contract RewardDistributor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    // Core components
    LendingPool public lendingPool;
    CredoToken public rewardToken;
    
    // Reward configuration
    uint256 public rewardRatePerSecond; // Rewards per second
    uint256 public lastUpdateTime;
    uint256 public totalRewardsDistributed;
    
    // User reward tracking
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public userRewards;
    mapping(address => mapping(address => uint256)) public userAssetRewards; // user => asset => rewards
    
    // Asset reward multipliers
    mapping(address => uint256) public assetRewardMultipliers; // Basis points
    mapping(address => bool) public rewardEnabledAssets;
    
    // Global reward state
    uint256 public globalRewardPerTokenStored;
    uint256 public totalStakedValue; // Total value staked across all assets
    
    // Events
    event RewardRateUpdated(uint256 newRate);
    event AssetRewardMultiplierUpdated(address indexed asset, uint256 multiplier);
    event RewardsDistributed(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed token, uint256 amount);

    /**
     * @dev Constructor
     * @param _lendingPool Address of the lending pool
     * @param _rewardToken Address of the reward token
     * @param initialOwner Initial owner of the contract
     */
    constructor(
        address _lendingPool,
        address _rewardToken,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_lendingPool != address(0), "Invalid lending pool address");
        require(_rewardToken != address(0), "Invalid reward token address");
        
        lendingPool = LendingPool(_lendingPool);
        rewardToken = CredoToken(_rewardToken);
        lastUpdateTime = block.timestamp;
    }

    /**
     * @dev Updates reward rate (only owner)
     * @param newRate New reward rate per second
     */
    function updateRewardRate(uint256 newRate) external onlyOwner {
        _updateGlobalReward();
        rewardRatePerSecond = newRate;
        emit RewardRateUpdated(newRate);
    }

    /**
     * @dev Sets reward multiplier for an asset (only owner)
     * @param asset Address of the asset
     * @param multiplier Multiplier in basis points (10000 = 1x)
     */
    function setAssetRewardMultiplier(address asset, uint256 multiplier) external onlyOwner {
        require(asset != address(0), "Invalid asset address");
        require(multiplier <= 20000, "Multiplier too high"); // Max 2x
        
        assetRewardMultipliers[asset] = multiplier;
        rewardEnabledAssets[asset] = multiplier > 0;
        
        emit AssetRewardMultiplierUpdated(asset, multiplier);
    }

    /**
     * @dev Updates rewards for a user
     * @param user Address of the user
     */
    function updateUserReward(address user) external {
        _updateGlobalReward();
        _updateUserReward(user);
    }

    /**
     * @dev Claims rewards for a user
     * @return Amount of rewards claimed
     */
    function claimRewards() external nonReentrant returns (uint256) {
        _updateGlobalReward();
        _updateUserReward(msg.sender);
        
        uint256 reward = userRewards[msg.sender];
        if (reward > 0) {
            userRewards[msg.sender] = 0;
            totalRewardsDistributed += reward;
            
            rewardToken.transfer(msg.sender, reward);
            
            emit RewardsClaimed(msg.sender, reward);
        }
        
        return reward;
    }

    /**
     * @dev Gets pending rewards for a user
     * @param user Address of the user
     * @return Pending reward amount
     */
    function getPendingRewards(address user) external view returns (uint256) {
        uint256 currentRewardPerToken = globalRewardPerTokenStored;
        
        if (totalStakedValue > 0 && block.timestamp > lastUpdateTime) {
            uint256 timeElapsed = block.timestamp - lastUpdateTime;
            uint256 reward = rewardRatePerSecond * timeElapsed;
            currentRewardPerToken += (reward * 1e18) / totalStakedValue;
        }
        
        uint256 userStakedValue = _getUserStakedValue(user);
        uint256 pendingReward = (userStakedValue * (currentRewardPerToken - userRewardPerTokenPaid[user])) / 1e18;
        
        return userRewards[user] + pendingReward;
    }

    /**
     * @dev Gets user's staked value across all assets
     * @param user Address of the user
     * @return Total staked value
     */
    function getUserStakedValue(address user) external view returns (uint256) {
        return _getUserStakedValue(user);
    }

    /**
     * @dev Gets asset reward multiplier
     * @param asset Address of the asset
     * @return Multiplier in basis points
     */
    function getAssetRewardMultiplier(address asset) external view returns (uint256) {
        return assetRewardMultipliers[asset];
    }

    /**
     * @dev Emergency withdraw function (only owner)
     * @param token Address of the token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20(token).safeTransfer(owner(), amount);
        emit EmergencyWithdraw(token, amount);
    }

    /**
     * @dev Updates global reward state
     */
    function _updateGlobalReward() internal {
        if (totalStakedValue > 0) {
            uint256 timeElapsed = block.timestamp - lastUpdateTime;
            uint256 reward = rewardRatePerSecond * timeElapsed;
            globalRewardPerTokenStored += (reward * 1e18) / totalStakedValue;
        }
        lastUpdateTime = block.timestamp;
    }

    /**
     * @dev Updates user reward state
     * @param user Address of the user
     */
    function _updateUserReward(address user) internal {
        uint256 userStakedValue = _getUserStakedValue(user);
        
        if (userStakedValue > 0) {
            uint256 pendingReward = (userStakedValue * (globalRewardPerTokenStored - userRewardPerTokenPaid[user])) / 1e18;
            userRewards[user] += pendingReward;
        }
        
        userRewardPerTokenPaid[user] = globalRewardPerTokenStored;
    }

    /**
     * @dev Gets user's staked value across all assets
     * @param user Address of the user
     * @return Total staked value
     */
    function _getUserStakedValue(address user) internal view returns (uint256) {
        uint256 totalValue = 0;
        
        // Get all supported assets from lending pool
        // Note: This is a simplified implementation
        // In production, you'd want to iterate through all supported assets
        
        // For now, we'll use the lending pool's getUserCollateralValue function
        totalValue = lendingPool.getUserCollateralValue(user);
        
        return totalValue;
    }

    /**
     * @dev Updates total staked value (called by lending pool)
     * @param newTotalStakedValue New total staked value
     */
    function updateTotalStakedValue(uint256 newTotalStakedValue) external {
        require(msg.sender == address(lendingPool), "Only lending pool can update");
        
        _updateGlobalReward();
        totalStakedValue = newTotalStakedValue;
    }

    /**
     * @dev Gets the current reward rate
     * @return Reward rate per second
     */
    function getRewardRate() external view returns (uint256) {
        return rewardRatePerSecond;
    }

    /**
     * @dev Gets total rewards distributed
     * @return Total rewards distributed
     */
    function getTotalRewardsDistributed() external view returns (uint256) {
        return totalRewardsDistributed;
    }

    /**
     * @dev Gets global reward per token stored
     * @return Global reward per token stored
     */
    function getGlobalRewardPerTokenStored() external view returns (uint256) {
        return globalRewardPerTokenStored;
    }

    /**
     * @dev Gets last update time
     * @return Last update timestamp
     */
    function getLastUpdateTime() external view returns (uint256) {
        return lastUpdateTime;
    }
}
