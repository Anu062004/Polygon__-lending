// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PriceOracleMock
 * @dev Mock price oracle for testing purposes
 * @notice This contract stores token prices in USD with 8 decimal precision
 */
contract PriceOracleMock is Ownable {
    // Price precision: 8 decimals (1e8 = 1 USD)
    uint256 public constant PRICE_PRECISION = 1e8;
    
    // Mapping from token address to price in USD (8 decimals)
    mapping(address => uint256) private _prices;
    
    // Events
    event PriceUpdated(address indexed token, uint256 oldPrice, uint256 newPrice);

    /**
     * @dev Constructor that sets the initial owner
     * @param initialOwner Initial owner of the contract
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Sets the price for a token
     * @param token Address of the token
     * @param price Price in USD with 8 decimal precision
     * @notice Only the owner can call this function
     */
    function setPrice(address token, uint256 price) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(price > 0, "Price must be greater than 0");
        
        uint256 oldPrice = _prices[token];
        _prices[token] = price;
        
        emit PriceUpdated(token, oldPrice, price);
    }

    /**
     * @dev Sets prices for multiple tokens
     * @param tokens Array of token addresses
     * @param prices Array of prices in USD with 8 decimal precision
     * @notice Only the owner can call this function
     */
    function setPrices(address[] calldata tokens, uint256[] calldata prices) external onlyOwner {
        require(tokens.length == prices.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "Invalid token address");
            require(prices[i] > 0, "Price must be greater than 0");
            
            uint256 oldPrice = _prices[tokens[i]];
            _prices[tokens[i]] = prices[i];
            
            emit PriceUpdated(tokens[i], oldPrice, prices[i]);
        }
    }

    /**
     * @dev Gets the price of a token
     * @param token Address of the token
     * @return Price in USD with 8 decimal precision
     */
    function getPrice(address token) external view returns (uint256) {
        require(token != address(0), "Invalid token address");
        uint256 price = _prices[token];
        require(price > 0, "Price not set for token");
        return price;
    }

    /**
     * @dev Gets the USD value of a token amount
     * @param token Address of the token
     * @param amount Amount of tokens
     * @param tokenDecimals Decimals of the token
     * @return USD value with 8 decimal precision
     */
    function getValue(address token, uint256 amount, uint8 tokenDecimals) external view returns (uint256) {
        uint256 price = this.getPrice(token);
        
        // Convert amount to 18 decimals for calculation
        uint256 normalizedAmount = amount;
        if (tokenDecimals < 18) {
            normalizedAmount = amount * (10 ** (18 - tokenDecimals));
        } else if (tokenDecimals > 18) {
            normalizedAmount = amount / (10 ** (tokenDecimals - 18));
        }
        
        // Calculate value: (amount * price) / 1e18
        return (normalizedAmount * price) / 1e18;
    }

    /**
     * @dev Checks if a token has a price set
     * @param token Address of the token
     * @return True if price is set, false otherwise
     */
    function hasPrice(address token) external view returns (bool) {
        return _prices[token] > 0;
    }
}



