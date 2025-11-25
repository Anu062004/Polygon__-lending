// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DebpolToken
 * @dev Governance token for the Debpol Protocol
 * @notice ERC20 token with voting capabilities for protocol governance
 */
contract DebpolToken is ERC20, ERC20Permit, ERC20Votes, Ownable, ReentrancyGuard {
    // Constants
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens max
    
    // Token distribution
    uint256 public constant COMMUNITY_ALLOCATION = 400_000_000 * 10**18; // 40%
    uint256 public constant TEAM_ALLOCATION = 150_000_000 * 10**18; // 15%
    uint256 public constant TREASURY_ALLOCATION = 200_000_000 * 10**18; // 20%
    uint256 public constant LIQUIDITY_ALLOCATION = 100_000_000 * 10**18; // 10%
    uint256 public constant RESERVE_ALLOCATION = 150_000_000 * 10**18; // 15%

    // Vesting parameters
    uint256 public constant VESTING_DURATION = 4 * 365 days; // 4 years
    uint256 public constant CLIFF_DURATION = 1 * 365 days; // 1 year cliff
    
    // Allocation tracking
    mapping(address => uint256) public teamVesting;
    mapping(address => uint256) public teamVestingStart;
    mapping(address => uint256) public teamVestingAmount;
    
    // Treasury and reserve addresses
    address public treasury;
    address public reserve;
    
    // Events
    event TeamMemberAdded(address indexed member, uint256 amount);
    event TreasuryUpdated(address indexed newTreasury);
    event ReserveUpdated(address indexed newReserve);
    event TokensVested(address indexed member, uint256 amount);

    /**
     * @dev Constructor
     * @param initialOwner Initial owner of the contract
     * @param _treasury Treasury address
     * @param _reserve Reserve address
     */
    constructor(
        address initialOwner,
        address _treasury,
        address _reserve
    ) ERC20("DebpolToken", "DEBPOL") ERC20Permit("DebpolToken") Ownable(initialOwner) {
        require(_treasury != address(0), "Invalid treasury address");
        require(_reserve != address(0), "Invalid reserve address");
        
        treasury = _treasury;
        reserve = _reserve;
        
        // Mint initial supply
        _mint(address(this), INITIAL_SUPPLY);
        
        // Distribute tokens
        _transfer(address(this), treasury, TREASURY_ALLOCATION);
        _transfer(address(this), reserve, RESERVE_ALLOCATION);
        
        // Community allocation remains in contract for distribution
        // Liquidity allocation remains in contract for DEX listing
    }

    /**
     * @dev Adds a team member with vesting
     * @param member Address of the team member
     * @param amount Amount to vest
     */
    function addTeamMember(address member, uint256 amount) external onlyOwner {
        require(member != address(0), "Invalid member address");
        require(amount > 0, "Amount must be greater than 0");
        require(teamVestingAmount[member] == 0, "Member already added");
        require(amount <= COMMUNITY_ALLOCATION, "Exceeds community allocation");
        
        teamVestingAmount[member] = amount;
        teamVestingStart[member] = block.timestamp;
        
        emit TeamMemberAdded(member, amount);
    }

    /**
     * @dev Claims vested tokens for team members
     */
    function claimVestedTokens() external nonReentrant {
        require(teamVestingAmount[msg.sender] > 0, "No vesting allocation");
        
        uint256 vestedAmount = getVestedAmount(msg.sender);
        require(vestedAmount > 0, "No tokens to claim");
        
        teamVesting[msg.sender] += vestedAmount;
        
        _transfer(address(this), msg.sender, vestedAmount);
        
        emit TokensVested(msg.sender, vestedAmount);
    }

    /**
     * @dev Gets the vested amount for a team member
     * @param member Address of the team member
     * @return Vested amount
     */
    function getVestedAmount(address member) public view returns (uint256) {
        if (teamVestingAmount[member] == 0) {
            return 0;
        }
        
        uint256 startTime = teamVestingStart[member];
        uint256 cliffEnd = startTime + CLIFF_DURATION;
        uint256 vestingEnd = startTime + VESTING_DURATION;
        
        if (block.timestamp < cliffEnd) {
            return 0; // Still in cliff period
        }
        
        if (block.timestamp >= vestingEnd) {
            return teamVestingAmount[member] - teamVesting[member]; // Fully vested
        }
        
        uint256 timeElapsed = block.timestamp - cliffEnd;
        uint256 vestingDuration = vestingEnd - cliffEnd;
        
        uint256 totalVested = (teamVestingAmount[member] * timeElapsed) / vestingDuration;
        uint256 claimed = teamVesting[member];
        
        return totalVested > claimed ? totalVested - claimed : 0;
    }

    /**
     * @dev Updates treasury address (only owner)
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    /**
     * @dev Updates reserve address (only owner)
     * @param newReserve New reserve address
     */
    function updateReserve(address newReserve) external onlyOwner {
        require(newReserve != address(0), "Invalid reserve address");
        reserve = newReserve;
        emit ReserveUpdated(newReserve);
    }

    /**
     * @dev Distributes community tokens
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to distribute
     */
    function distributeCommunityTokens(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(amounts[i] > 0, "Amount must be greater than 0");
            
            _transfer(address(this), recipients[i], amounts[i]);
        }
    }

    /**
     * @dev Distributes liquidity tokens for DEX listing
     * @param dexAddress DEX address
     * @param amount Amount to distribute
     */
    function distributeLiquidityTokens(address dexAddress, uint256 amount) external onlyOwner {
        require(dexAddress != address(0), "Invalid DEX address");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= LIQUIDITY_ALLOCATION, "Exceeds liquidity allocation");
        
        _transfer(address(this), dexAddress, amount);
    }

    /**
     * @dev Gets the remaining community allocation
     * @return Remaining amount
     */
    function getRemainingCommunityAllocation() external view returns (uint256) {
        return balanceOf(address(this));
    }

    /**
     * @dev Gets team member vesting info
     * @param member Address of the team member
     * @return totalAmount Total vesting amount
     * @return claimedAmount Amount already claimed
     * @return vestedAmount Currently vested amount
     * @return startTime Vesting start time
     */
    function getTeamMemberInfo(address member) external view returns (
        uint256 totalAmount,
        uint256 claimedAmount,
        uint256 vestedAmount,
        uint256 startTime
    ) {
        totalAmount = teamVestingAmount[member];
        claimedAmount = teamVesting[member];
        vestedAmount = getVestedAmount(member);
        startTime = teamVestingStart[member];
    }

    // Required overrides for ERC20Votes
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
