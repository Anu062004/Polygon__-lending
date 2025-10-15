// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./PriceOracleMock.sol";
import "./InterestRateModelAaveStyle.sol";
import "./AToken.sol";
import "./DebtToken.sol";
import "./PoolConfigurator.sol";

/**
 * @title LendingPool
 * @dev Core lending pool contract implementing Aave-style functionality
 * @notice Handles deposits, withdrawals, borrowing, repaying, and liquidations
 */
contract LendingPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Core components
    PriceOracleMock public oracle;
    InterestRateModelAaveStyle public interestRateModel;
    PoolConfigurator public configurator;
    
    // Asset mappings
    mapping(address => AToken) public aTokens;
    mapping(address => DebtToken) public debtTokens;
    mapping(address => bool) public supportedAssets;
    
    // User data
    mapping(address => mapping(address => uint256)) public userCollateral; // user => asset => amount
    mapping(address => mapping(address => uint256)) public userBorrows; // user => asset => amount
    
    // Pool data
    mapping(address => uint256) public totalSupplied;
    mapping(address => uint256) public totalBorrowed;
    mapping(address => uint256) public lastUpdateTimestamp;
    
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    // Events
    event Deposit(address indexed user, address indexed asset, uint256 amount, uint256 aTokenAmount);
    event Withdraw(address indexed user, address indexed asset, uint256 amount, uint256 aTokenAmount);
    event Borrow(address indexed user, address indexed asset, uint256 amount, uint256 debtTokenAmount);
    event Repay(address indexed user, address indexed asset, uint256 amount, uint256 debtTokenAmount);
    event Liquidation(
        address indexed liquidator,
        address indexed borrower,
        address indexed collateralAsset,
        address debtAsset,
        uint256 collateralAmount,
        uint256 debtAmount,
        uint256 bonus
    );
    event InterestAccrued(address indexed asset, uint256 supplyIndex, uint256 debtIndex, uint256 timestamp);

    /**
     * @dev Constructor
     * @param _oracle Address of the price oracle
     * @param _interestRateModel Address of the interest rate model
     * @param _configurator Address of the pool configurator
     * @param initialOwner Initial owner of the contract
     */
    constructor(
        address _oracle,
        address _interestRateModel,
        address _configurator,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_oracle != address(0), "Invalid oracle address");
        require(_interestRateModel != address(0), "Invalid interest rate model address");
        require(_configurator != address(0), "Invalid configurator address");
        
        oracle = PriceOracleMock(_oracle);
        interestRateModel = InterestRateModelAaveStyle(_interestRateModel);
        configurator = PoolConfigurator(_configurator);
    }

    /**
     * @dev Sets the aToken for an asset
     * @param asset Address of the asset
     * @param aToken Address of the aToken
     * @notice Only the owner can call this function
     */
    function setAToken(address asset, address aToken) external onlyOwner {
        require(asset != address(0), "Invalid asset address");
        require(aToken != address(0), "Invalid aToken address");
        aTokens[asset] = AToken(aToken);
        supportedAssets[asset] = true;
    }

    /**
     * @dev Sets the debt token for an asset
     * @param asset Address of the asset
     * @param debtToken Address of the debt token
     * @notice Only the owner can call this function
     */
    function setDebtToken(address asset, address debtToken) external onlyOwner {
        require(asset != address(0), "Invalid asset address");
        require(debtToken != address(0), "Invalid debt token address");
        debtTokens[asset] = DebtToken(debtToken);
    }

    /**
     * @dev Deposits assets into the lending pool
     * @param asset Address of the asset to deposit
     * @param amount Amount to deposit
     */
    function deposit(address asset, uint256 amount) external nonReentrant {
        require(supportedAssets[asset], "Asset not supported");
        require(amount > 0, "Amount must be greater than 0");
        require(configurator.isAssetActive(asset), "Asset not active");
        
        _accrueInterest(asset);
        
        // Transfer tokens from user
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        
        // Update user collateral
        userCollateral[msg.sender][asset] += amount;
        
        // Update total supplied
        totalSupplied[asset] += amount;
        
        // Mint aTokens
        uint256 aTokenAmount = aTokens[asset].mint(msg.sender, amount);
        
        emit Deposit(msg.sender, asset, amount, aTokenAmount);
    }

    /**
     * @dev Withdraws assets from the lending pool
     * @param asset Address of the asset to withdraw
     * @param amount Amount to withdraw
     */
    function withdraw(address asset, uint256 amount) external nonReentrant {
        require(supportedAssets[asset], "Asset not supported");
        require(amount > 0, "Amount must be greater than 0");
        require(userCollateral[msg.sender][asset] >= amount, "Insufficient collateral");
        
        _accrueInterest(asset);
        
        // Check health factor after withdrawal
        require(_getHealthFactor(msg.sender) >= 1e18, "Health factor too low");
        
        // Update user collateral
        userCollateral[msg.sender][asset] -= amount;
        
        // Update total supplied
        totalSupplied[asset] -= amount;
        
        // Burn aTokens
        uint256 aTokenAmount = aTokens[asset].burn(msg.sender, amount);
        
        // Transfer tokens to user
        IERC20(asset).safeTransfer(msg.sender, amount);
        
        emit Withdraw(msg.sender, asset, amount, aTokenAmount);
    }

    /**
     * @dev Borrows assets from the lending pool
     * @param asset Address of the asset to borrow
     * @param amount Amount to borrow
     */
    function borrow(address asset, uint256 amount) external nonReentrant {
        require(supportedAssets[asset], "Asset not supported");
        require(amount > 0, "Amount must be greater than 0");
        require(configurator.isAssetActive(asset), "Asset not active");
        require(totalSupplied[asset] >= amount, "Insufficient liquidity");
        
        _accrueInterest(asset);
        
        // Calculate new borrow amount
        uint256 newBorrowAmount = userBorrows[msg.sender][asset] + amount;
        
        // Check health factor
        require(_getHealthFactorAfterBorrow(msg.sender, asset, newBorrowAmount) >= 1e18, "Health factor too low");
        
        // Update user borrows
        userBorrows[msg.sender][asset] = newBorrowAmount;
        
        // Update total borrowed
        totalBorrowed[asset] += amount;
        
        // Mint debt tokens
        uint256 debtTokenAmount = debtTokens[asset].mint(msg.sender, amount);
        
        // Transfer tokens to user
        IERC20(asset).safeTransfer(msg.sender, amount);
        
        emit Borrow(msg.sender, asset, amount, debtTokenAmount);
    }

    /**
     * @dev Repays borrowed assets
     * @param asset Address of the asset to repay
     * @param amount Amount to repay
     */
    function repay(address asset, uint256 amount) external nonReentrant {
        require(supportedAssets[asset], "Asset not supported");
        require(amount > 0, "Amount must be greater than 0");
        
        _accrueInterest(asset);
        
        uint256 userDebt = userBorrows[msg.sender][asset];
        require(userDebt > 0, "No debt to repay");
        
        uint256 repayAmount = amount > userDebt ? userDebt : amount;
        
        // Transfer tokens from user
        IERC20(asset).safeTransferFrom(msg.sender, address(this), repayAmount);
        
        // Update user borrows
        userBorrows[msg.sender][asset] -= repayAmount;
        
        // Update total borrowed
        totalBorrowed[asset] -= repayAmount;
        
        // Burn debt tokens
        uint256 debtTokenAmount = debtTokens[asset].burn(msg.sender, repayAmount);
        
        emit Repay(msg.sender, asset, repayAmount, debtTokenAmount);
    }

    /**
     * @dev Liquidates a borrower's position
     * @param collateralAsset Address of the collateral asset
     * @param debtAsset Address of the debt asset
     * @param borrower Address of the borrower to liquidate
     * @param debtAmount Amount of debt to repay
     */
    function liquidate(
        address collateralAsset,
        address debtAsset,
        address borrower,
        uint256 debtAmount
    ) external nonReentrant {
        require(supportedAssets[collateralAsset], "Collateral asset not supported");
        require(supportedAssets[debtAsset], "Debt asset not supported");
        require(debtAmount > 0, "Debt amount must be greater than 0");
        require(borrower != msg.sender, "Cannot liquidate own position");
        
        _accrueInterest(collateralAsset);
        _accrueInterest(debtAsset);
        
        // Check if borrower is liquidatable
        require(_getHealthFactor(borrower) < 1e18, "Borrower not liquidatable");
        
        uint256 borrowerDebt = userBorrows[borrower][debtAsset];
        require(borrowerDebt >= debtAmount, "Insufficient debt to liquidate");
        
        // Calculate collateral amount to seize
        uint256 collateralAmount = _calculateLiquidationAmount(
            collateralAsset,
            debtAsset,
            debtAmount
        );
        
        require(userCollateral[borrower][collateralAsset] >= collateralAmount, "Insufficient collateral");
        
        // Transfer debt tokens from liquidator
        IERC20(debtAsset).safeTransferFrom(msg.sender, address(this), debtAmount);
        
        // Update borrower's debt
        userBorrows[borrower][debtAsset] -= debtAmount;
        totalBorrowed[debtAsset] -= debtAmount;
        
        // Update borrower's collateral
        userCollateral[borrower][collateralAsset] -= collateralAmount;
        totalSupplied[collateralAsset] -= collateralAmount;
        
        // Burn debt tokens
        debtTokens[debtAsset].burn(borrower, debtAmount);
        
        // Burn aTokens
        aTokens[collateralAsset].burn(borrower, collateralAmount);
        
        // Transfer collateral to liquidator
        IERC20(collateralAsset).safeTransfer(msg.sender, collateralAmount);
        
        emit Liquidation(msg.sender, borrower, collateralAsset, debtAsset, collateralAmount, debtAmount, 0);
    }

    /**
     * @dev Accrues interest for an asset
     * @param asset Address of the asset
     */
    function _accrueInterest(address asset) internal {
        uint256 currentTimestamp = block.timestamp;
        uint256 lastUpdate = lastUpdateTimestamp[asset];
        
        if (currentTimestamp <= lastUpdate) {
            return;
        }
        
        uint256 timeElapsed = currentTimestamp - lastUpdate;
        uint256 totalSupply = totalSupplied[asset];
        uint256 totalBorrow = totalBorrowed[asset];
        
        if (totalBorrow > 0) {
            uint256 borrowRate = interestRateModel.getBorrowRate(totalBorrow, totalSupply);
            uint256 interestAccrued = (totalBorrow * borrowRate * timeElapsed) / 1e18;
            
            totalBorrowed[asset] += interestAccrued;
            totalBorrow = totalBorrowed[asset];
        }
        
        if (totalSupply > 0) {
            uint256 supplyRate = interestRateModel.getSupplyRate(totalBorrow, totalSupply);
            uint256 interestAccrued = (totalSupply * supplyRate * timeElapsed) / 1e18;
            
            totalSupplied[asset] += interestAccrued;
        }
        
        lastUpdateTimestamp[asset] = currentTimestamp;
        
        // Update indices
        if (totalSupply > 0) {
            uint256 newSupplyIndex = aTokens[asset].getInterestIndex() + 
                (aTokens[asset].getInterestIndex() * interestRateModel.getSupplyRate(totalBorrow, totalSupply) * timeElapsed) / 1e18;
            aTokens[asset].updateInterestIndex(newSupplyIndex);
        }
        
        if (totalBorrow > 0) {
            uint256 newDebtIndex = debtTokens[asset].getDebtIndex() + 
                (debtTokens[asset].getDebtIndex() * interestRateModel.getBorrowRate(totalBorrow, totalSupply) * timeElapsed) / 1e18;
            debtTokens[asset].updateDebtIndex(newDebtIndex);
        }
        
        emit InterestAccrued(asset, aTokens[asset].getInterestIndex(), debtTokens[asset].getDebtIndex(), currentTimestamp);
    }

    /**
     * @dev Calculates the health factor for a user
     * @param user Address of the user
     * @return Health factor (scaled by 1e18)
     */
    function _getHealthFactor(address user) internal view returns (uint256) {
        uint256 totalCollateralValue = 0;
        uint256 totalDebtValue = 0;
        
        // Calculate total collateral value
        for (uint256 i = 0; i < _getSupportedAssetsLength(); i++) {
            address asset = _getSupportedAsset(i);
            if (userCollateral[user][asset] > 0) {
                uint256 collateralValue = oracle.getValue(asset, userCollateral[user][asset], IERC20Metadata(asset).decimals());
                uint256 threshold = configurator.getLiquidationThreshold(asset);
                totalCollateralValue += (collateralValue * threshold) / BASIS_POINTS;
            }
        }
        
        // Calculate total debt value
        for (uint256 i = 0; i < _getSupportedAssetsLength(); i++) {
            address asset = _getSupportedAsset(i);
            if (userBorrows[user][asset] > 0) {
                totalDebtValue += oracle.getValue(asset, userBorrows[user][asset], IERC20Metadata(asset).decimals());
            }
        }
        
        if (totalDebtValue == 0) {
            return type(uint256).max; // No debt = infinite health factor
        }
        
        return (totalCollateralValue * 1e18) / totalDebtValue;
    }

    /**
     * @dev Calculates the health factor after a borrow
     * @param user Address of the user
     * @param asset Address of the asset being borrowed
     * @param newBorrowAmount New borrow amount
     * @return Health factor (scaled by 1e18)
     */
    function _getHealthFactorAfterBorrow(address user, address asset, uint256 newBorrowAmount) internal view returns (uint256) {
        uint256 totalCollateralValue = 0;
        uint256 totalDebtValue = 0;
        
        // Calculate total collateral value
        for (uint256 i = 0; i < _getSupportedAssetsLength(); i++) {
            address collateralAsset = _getSupportedAsset(i);
            if (userCollateral[user][collateralAsset] > 0) {
                uint256 collateralValue = oracle.getValue(collateralAsset, userCollateral[user][collateralAsset], IERC20Metadata(collateralAsset).decimals());
                uint256 threshold = configurator.getLiquidationThreshold(collateralAsset);
                totalCollateralValue += (collateralValue * threshold) / BASIS_POINTS;
            }
        }
        
        // Calculate total debt value
        for (uint256 i = 0; i < _getSupportedAssetsLength(); i++) {
            address debtAsset = _getSupportedAsset(i);
            uint256 debtAmount = userBorrows[user][debtAsset];
            if (debtAsset == asset) {
                debtAmount = newBorrowAmount;
            }
            if (debtAmount > 0) {
                totalDebtValue += oracle.getValue(debtAsset, debtAmount, IERC20Metadata(debtAsset).decimals());
            }
        }
        
        if (totalDebtValue == 0) {
            return type(uint256).max;
        }
        
        return (totalCollateralValue * 1e18) / totalDebtValue;
    }

    /**
     * @dev Calculates the liquidation amount
     * @param collateralAsset Address of the collateral asset
     * @param debtAsset Address of the debt asset
     * @param debtAmount Amount of debt to repay
     * @return Collateral amount to seize
     */
    function _calculateLiquidationAmount(
        address collateralAsset,
        address debtAsset,
        uint256 debtAmount
    ) internal view returns (uint256) {
        uint256 debtValue = oracle.getValue(debtAsset, debtAmount, IERC20Metadata(debtAsset).decimals());
        uint256 collateralPrice = oracle.getPrice(collateralAsset);
        uint256 liquidationBonus = configurator.getLiquidationBonus(collateralAsset);
        
        // Calculate collateral amount: (debtValue * liquidationBonus) / collateralPrice
        uint256 collateralAmount = (debtValue * liquidationBonus) / (collateralPrice * BASIS_POINTS);
        
        // Convert to collateral asset decimals
        uint8 collateralDecimals = IERC20Metadata(collateralAsset).decimals();
        if (collateralDecimals < 18) {
            collateralAmount = collateralAmount / (10 ** (18 - collateralDecimals));
        } else if (collateralDecimals > 18) {
            collateralAmount = collateralAmount * (10 ** (collateralDecimals - 18));
        }
        
        return collateralAmount;
    }

    /**
     * @dev Gets the health factor for a user
     * @param user Address of the user
     * @return Health factor (scaled by 1e18)
     */
    function getHealthFactor(address user) external view returns (uint256) {
        return _getHealthFactor(user);
    }

    /**
     * @dev Gets the total collateral value for a user
     * @param user Address of the user
     * @return Total collateral value in USD
     */
    function getTotalCollateralValue(address user) external view returns (uint256) {
        uint256 totalValue = 0;
        for (uint256 i = 0; i < _getSupportedAssetsLength(); i++) {
            address asset = _getSupportedAsset(i);
            if (userCollateral[user][asset] > 0) {
                totalValue += oracle.getValue(asset, userCollateral[user][asset], IERC20Metadata(asset).decimals());
            }
        }
        return totalValue;
    }

    /**
     * @dev Gets the total debt value for a user
     * @param user Address of the user
     * @return Total debt value in USD
     */
    function getTotalDebtValue(address user) external view returns (uint256) {
        uint256 totalValue = 0;
        for (uint256 i = 0; i < _getSupportedAssetsLength(); i++) {
            address asset = _getSupportedAsset(i);
            if (userBorrows[user][asset] > 0) {
                totalValue += oracle.getValue(asset, userBorrows[user][asset], IERC20Metadata(asset).decimals());
            }
        }
        return totalValue;
    }

    /**
     * @dev Gets the utilization rate for an asset
     * @param asset Address of the asset
     * @return Utilization rate in basis points
     */
    function getUtilizationRate(address asset) external view returns (uint256) {
        return interestRateModel.getUtilizationRate(totalBorrowed[asset], totalSupplied[asset]);
    }

    /**
     * @dev Gets the borrow rate for an asset
     * @param asset Address of the asset
     * @return Borrow rate per second (scaled by 1e18)
     */
    function getBorrowRate(address asset) external view returns (uint256) {
        return interestRateModel.getBorrowRate(totalBorrowed[asset], totalSupplied[asset]);
    }

    /**
     * @dev Gets the supply rate for an asset
     * @param asset Address of the asset
     * @return Supply rate per second (scaled by 1e18)
     */
    function getSupplyRate(address asset) external view returns (uint256) {
        return interestRateModel.getSupplyRate(totalBorrowed[asset], totalSupplied[asset]);
    }

    /**
     * @dev Gets the number of supported assets
     * @return Number of supported assets
     */
    function _getSupportedAssetsLength() internal view returns (uint256) {
        // This is a simplified implementation
        // In a real implementation, you would maintain a list of supported assets
        return 2; // Assuming 2 assets (mUSDC and mBTC)
    }

    /**
     * @dev Gets a supported asset by index
     * @param index Index of the asset
     * @return Address of the asset
     */
    function _getSupportedAsset(uint256 index) internal view returns (address) {
        // This is a simplified implementation
        // In a real implementation, you would maintain a list of supported assets
        require(index < 2, "Invalid asset index");
        // Return mock addresses - in real implementation, these would be stored
        return index == 0 ? address(0x1) : address(0x2);
    }
}



