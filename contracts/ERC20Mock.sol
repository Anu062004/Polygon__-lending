// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC20Mock
 * @dev Mock ERC20 token for testing purposes with mintable functionality
 * @notice This contract is for testing only and should not be used in production
 */
contract ERC20Mock is ERC20, Ownable {
    uint8 private _decimals;

    /**
     * @dev Constructor that sets the token name, symbol, decimals, and initial owner
     * @param name_ Token name
     * @param symbol_ Token symbol
     * @param decimals_ Token decimals
     * @param initialOwner Initial owner of the contract
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address initialOwner
    ) ERC20(name_, symbol_) Ownable(initialOwner) {
        _decimals = decimals_;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation
     * @return Number of decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mints tokens to a specified address
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     * @notice Only the owner can call this function
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burns tokens from a specified address
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     * @notice Only the owner can call this function
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    /**
     * @dev Mints tokens to multiple addresses (batch minting)
     * @param recipients Array of addresses to mint tokens to
     * @param amounts Array of amounts to mint to each address
     * @notice Only the owner can call this function
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }
}



