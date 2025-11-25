// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/**
 * @title OracleAggregator
 * @dev Aggregates multiple price oracles for enhanced security and reliability
 * @notice Provides fallback mechanisms and price validation for the Debpol Protocol
 */
// Oracle interface
interface IPriceOracle {
    function getPrice(address token) external view returns (uint256);
    function getValue(address token, uint256 amount, uint8 decimals) external view returns (uint256);
    function isPriceValid(address token) external view returns (bool);
}

// Chainlink interface
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

contract OracleAggregator is Ownable, ReentrancyGuard {
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_PRICE_DEVIATION = 500; // 5% max deviation
    uint256 public constant PRICE_TIMEOUT = 3600; // 1 hour timeout
    
    // Oracle data
    struct OracleData {
        address oracle;
        uint256 weight; // Weight in basis points
        bool active;
        uint256 lastUpdateTime;
    }
    
    // Token oracle mappings
    mapping(address => OracleData[]) public tokenOracles;
    mapping(address => uint256) public tokenPrices; // Cached prices
    mapping(address => uint256) public tokenLastUpdateTime;
    
    mapping(address => AggregatorV3Interface) public chainlinkFeeds;
    
    // Events
    event OracleAdded(address indexed token, address indexed oracle, uint256 weight);
    event OracleRemoved(address indexed token, address indexed oracle);
    event OracleWeightUpdated(address indexed token, address indexed oracle, uint256 weight);
    event PriceUpdated(address indexed token, uint256 price, uint256 timestamp);
    event ChainlinkFeedSet(address indexed token, address indexed feed);

    /**
     * @dev Constructor
     * @param initialOwner Initial owner of the contract
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Adds an oracle for a token
     * @param token Address of the token
     * @param oracle Address of the oracle
     * @param weight Weight in basis points
     */
    function addOracle(address token, address oracle, uint256 weight) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(oracle != address(0), "Invalid oracle address");
        require(weight > 0 && weight <= BASIS_POINTS, "Invalid weight");
        
        // Check if oracle already exists
        OracleData[] storage oracles = tokenOracles[token];
        for (uint256 i = 0; i < oracles.length; i++) {
            require(oracles[i].oracle != oracle, "Oracle already exists");
        }
        
        oracles.push(OracleData({
            oracle: oracle,
            weight: weight,
            active: true,
            lastUpdateTime: block.timestamp
        }));
        
        emit OracleAdded(token, oracle, weight);
    }

    /**
     * @dev Removes an oracle for a token
     * @param token Address of the token
     * @param oracle Address of the oracle to remove
     */
    function removeOracle(address token, address oracle) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(oracle != address(0), "Invalid oracle address");
        
        OracleData[] storage oracles = tokenOracles[token];
        for (uint256 i = 0; i < oracles.length; i++) {
            if (oracles[i].oracle == oracle) {
                oracles[i] = oracles[oracles.length - 1];
                oracles.pop();
                emit OracleRemoved(token, oracle);
                return;
            }
        }
        
        revert("Oracle not found");
    }

    /**
     * @dev Updates oracle weight
     * @param token Address of the token
     * @param oracle Address of the oracle
     * @param weight New weight in basis points
     */
    function updateOracleWeight(address token, address oracle, uint256 weight) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(oracle != address(0), "Invalid oracle address");
        require(weight > 0 && weight <= BASIS_POINTS, "Invalid weight");
        
        OracleData[] storage oracles = tokenOracles[token];
        for (uint256 i = 0; i < oracles.length; i++) {
            if (oracles[i].oracle == oracle) {
                oracles[i].weight = weight;
                emit OracleWeightUpdated(token, oracle, weight);
                return;
            }
        }
        
        revert("Oracle not found");
    }

    /**
     * @dev Sets Chainlink price feed for a token
     * @param token Address of the token
     * @param feed Address of the Chainlink feed
     */
    function setChainlinkFeed(address token, address feed) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(feed != address(0), "Invalid feed address");
        
        chainlinkFeeds[token] = AggregatorV3Interface(feed);
        emit ChainlinkFeedSet(token, feed);
    }

    /**
     * @dev Gets the price for a token using aggregated oracles
     * @param token Address of the token
     * @return Price in 8 decimals
     */
    function getPrice(address token) external view returns (uint256) {
        require(token != address(0), "Invalid token address");
        
        // Check if price is cached and not expired
        if (block.timestamp - tokenLastUpdateTime[token] < PRICE_TIMEOUT) {
            return tokenPrices[token];
        }
        
        return _calculateAggregatedPrice(token);
    }

    /**
     * @dev Gets the value for a token amount
     * @param token Address of the token
     * @param amount Amount of tokens
     * @param decimals Token decimals
     * @return Value in 18 decimals
     */
    function getValue(address token, uint256 amount, uint8 decimals) external view returns (uint256) {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 price = this.getPrice(token);
        
        // Convert amount to 18 decimals
        uint256 normalizedAmount = amount;
        if (decimals < 18) {
            normalizedAmount = amount * (10 ** (18 - decimals));
        } else if (decimals > 18) {
            normalizedAmount = amount / (10 ** (decimals - 18));
        }
        
        // Price is in 8 decimals, convert to 18 decimals
        return (normalizedAmount * price) / 1e8;
    }

    /**
     * @dev Updates cached price for a token
     * @param token Address of the token
     */
    function updatePrice(address token) external {
        require(token != address(0), "Invalid token address");
        
        uint256 newPrice = _calculateAggregatedPrice(token);
        tokenPrices[token] = newPrice;
        tokenLastUpdateTime[token] = block.timestamp;
        
        emit PriceUpdated(token, newPrice, block.timestamp);
    }

    /**
     * @dev Calculates aggregated price from multiple oracles
     * @param token Address of the token
     * @return Aggregated price in 8 decimals
     */
    function _calculateAggregatedPrice(address token) internal view returns (uint256) {
        OracleData[] memory oracles = tokenOracles[token];
        require(oracles.length > 0, "No oracles configured");
        
        uint256 totalWeight = 0;
        uint256 weightedPrice = 0;
        
        // Try Chainlink first if available
        AggregatorV3Interface chainlinkFeed = chainlinkFeeds[token];
        if (address(chainlinkFeed) != address(0)) {
            try chainlinkFeed.latestRoundData() returns (
                uint80,
                int256 answer,
                uint256,
                uint256 updatedAt,
                uint80
            ) {
                if (answer > 0 && block.timestamp - updatedAt < PRICE_TIMEOUT) {
                    uint8 feedDecimals = chainlinkFeed.decimals();
                    uint256 price = uint256(answer);
                    
                    // Convert to 8 decimals
                    if (feedDecimals < 8) {
                        price = price * (10 ** (8 - feedDecimals));
                    } else if (feedDecimals > 8) {
                        price = price / (10 ** (feedDecimals - 8));
                    }
                    
                    return price;
                }
            } catch {
                // Chainlink failed, continue with other oracles
            }
        }
        
        // Aggregate from other oracles
        for (uint256 i = 0; i < oracles.length; i++) {
            if (oracles[i].active) {
                try IPriceOracle(oracles[i].oracle).getPrice(token) returns (uint256 price) {
                    if (price > 0) {
                        weightedPrice += price * oracles[i].weight;
                        totalWeight += oracles[i].weight;
                    }
                } catch {
                    // Oracle failed, skip
                }
            }
        }
        
        require(totalWeight > 0, "No valid oracles");
        return weightedPrice / totalWeight;
    }

    /**
     * @dev Validates price deviation between oracles
     * @param token Address of the token
     * @return True if price deviation is within acceptable range
     */
    function validatePriceDeviation(address token) external view returns (bool) {
        OracleData[] memory oracles = tokenOracles[token];
        if (oracles.length < 2) {
            return true; // Need at least 2 oracles to compare
        }
        
        uint256[] memory prices = new uint256[](oracles.length);
        uint256 validPrices = 0;
        
        // Get prices from all oracles
        for (uint256 i = 0; i < oracles.length; i++) {
            if (oracles[i].active) {
                try IPriceOracle(oracles[i].oracle).getPrice(token) returns (uint256 price) {
                    if (price > 0) {
                        prices[validPrices] = price;
                        validPrices++;
                    }
                } catch {
                    // Oracle failed, skip
                }
            }
        }
        
        if (validPrices < 2) {
            return true; // Not enough prices to compare
        }
        
        // Calculate min and max prices
        uint256 minPrice = prices[0];
        uint256 maxPrice = prices[0];
        
        for (uint256 i = 1; i < validPrices; i++) {
            if (prices[i] < minPrice) {
                minPrice = prices[i];
            }
            if (prices[i] > maxPrice) {
                maxPrice = prices[i];
            }
        }
        
        // Check deviation
        uint256 deviation = ((maxPrice - minPrice) * BASIS_POINTS) / minPrice;
        return deviation <= MAX_PRICE_DEVIATION;
    }

    /**
     * @dev Gets oracle count for a token
     * @param token Address of the token
     * @return Number of oracles
     */
    function getOracleCount(address token) external view returns (uint256) {
        return tokenOracles[token].length;
    }

    /**
     * @dev Gets oracle data for a token
     * @param token Address of the token
     * @param index Index of the oracle
     * @return oracle Oracle address
     * @return weight Oracle weight
     * @return active Whether oracle is active
     */
    function getOracleData(address token, uint256 index) external view returns (
        address oracle,
        uint256 weight,
        bool active
    ) {
        require(index < tokenOracles[token].length, "Invalid index");
        
        OracleData memory data = tokenOracles[token][index];
        return (data.oracle, data.weight, data.active);
    }

    /**
     * @dev Checks if price is valid (not expired)
     * @param token Address of the token
     * @return True if price is valid
     */
    function isPriceValid(address token) external view returns (bool) {
        return block.timestamp - tokenLastUpdateTime[token] < PRICE_TIMEOUT;
    }
}
