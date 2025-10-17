// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

/**
 * @title InterestRateModelAaveStyle
 * @dev Aave-style 2-slope interest rate model
 * @notice Implements the interest rate calculation based on utilization rate
 */
contract InterestRateModelAaveStyle {
    // Interest rate parameters (in basis points, 1 basis point = 0.01%)
    uint256 public constant BASE_RATE_APR = 0; // 0% base rate
    uint256 public constant SLOPE1_APR = 400; // 4% slope1
    uint256 public constant SLOPE2_APR = 7500; // 75% slope2
    uint256 public constant OPTIMAL_UTILIZATION = 8000; // 80% optimal utilization (in basis points)
    
    // Constants for calculations
    uint256 public constant BASIS_POINTS = 10000; // 100%
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    // Reserve factor (10%)
    uint256 public constant RESERVE_FACTOR = 1000; // 10% in basis points

    /**
     * @dev Calculates the borrow rate based on utilization
     * @param totalBorrows Total amount borrowed
     * @param totalSupply Total amount supplied
     * @return Borrow rate per second (scaled by 1e18)
     */
    function getBorrowRate(uint256 totalBorrows, uint256 totalSupply) external pure returns (uint256) {
        if (totalSupply == 0) {
            return 0;
        }
        
        // Calculate utilization rate (in basis points)
        uint256 utilization = (totalBorrows * BASIS_POINTS) / totalSupply;
        
        uint256 borrowRate;
        
        if (utilization <= OPTIMAL_UTILIZATION) {
            // First slope: base + (util / optimal) * slope1
            borrowRate = BASE_RATE_APR + (utilization * SLOPE1_APR) / OPTIMAL_UTILIZATION;
        } else {
            // Second slope: base + slope1 + ((util - optimal) / (100% - optimal)) * slope2
            uint256 excessUtilization = utilization - OPTIMAL_UTILIZATION;
            uint256 excessSlope = (excessUtilization * SLOPE2_APR) / (BASIS_POINTS - OPTIMAL_UTILIZATION);
            borrowRate = BASE_RATE_APR + SLOPE1_APR + excessSlope;
        }
        
        // Convert from APR (basis points) to rate per second
        // ratePerSecond = (APR / 10000) / secondsPerYear
        return (borrowRate * 1e18) / (BASIS_POINTS * SECONDS_PER_YEAR);
    }

    /**
     * @dev Calculates the supply rate based on utilization and borrow rate
     * @param totalBorrows Total amount borrowed
     * @param totalSupply Total amount supplied
     * @return Supply rate per second (scaled by 1e18)
     */
    function getSupplyRate(uint256 totalBorrows, uint256 totalSupply) external pure returns (uint256) {
        if (totalSupply == 0) {
            return 0;
        }
        // Borrow rate computed inline to keep function pure
        uint256 utilization = (totalBorrows * BASIS_POINTS) / totalSupply;
        uint256 borrowRate;
        if (utilization <= OPTIMAL_UTILIZATION) {
            borrowRate = BASE_RATE_APR + (utilization * SLOPE1_APR) / OPTIMAL_UTILIZATION;
        } else {
            uint256 excessUtilization = utilization - OPTIMAL_UTILIZATION;
            uint256 excessSlope = (excessUtilization * SLOPE2_APR) / (BASIS_POINTS - OPTIMAL_UTILIZATION);
            borrowRate = BASE_RATE_APR + SLOPE1_APR + excessSlope;
        }
        borrowRate = (borrowRate * 1e18) / (BASIS_POINTS * SECONDS_PER_YEAR);
        
        // Supply rate = borrow rate * utilization * (1 - reserve factor)
        uint256 supplyRate = (borrowRate * utilization * (BASIS_POINTS - RESERVE_FACTOR)) / (BASIS_POINTS * BASIS_POINTS);
        
        return supplyRate;
    }

    /**
     * @dev Gets the utilization rate
     * @param totalBorrows Total amount borrowed
     * @param totalSupply Total amount supplied
     * @return Utilization rate in basis points
     */
    function getUtilizationRate(uint256 totalBorrows, uint256 totalSupply) external pure returns (uint256) {
        if (totalSupply == 0) {
            return 0;
        }
        return (totalBorrows * BASIS_POINTS) / totalSupply;
    }

    /**
     * @dev Gets all interest rate parameters
     * @return baseRate Base rate in basis points
     * @return slope1 First slope in basis points
     * @return slope2 Second slope in basis points
     * @return optimalUtil Optimal utilization in basis points
     * @return reserveFactor Reserve factor in basis points
     */
    function getParameters() external pure returns (
        uint256 baseRate,
        uint256 slope1,
        uint256 slope2,
        uint256 optimalUtil,
        uint256 reserveFactor
    ) {
        return (BASE_RATE_APR, SLOPE1_APR, SLOPE2_APR, OPTIMAL_UTILIZATION, RESERVE_FACTOR);
    }
}



