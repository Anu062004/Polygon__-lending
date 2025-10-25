const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Credo Protocol Integration Tests", function () {
    let owner, user1, user2, user3;
    let lendingPool, flashLoanProvider, credoToken, rewardDistributor, oracleAggregator;
    let mUSDC, mBTC, amUSDC, amBTC, debtmUSDC, debtmBTC;
    let oracle, interestRateModel, configurator;

    beforeEach(async function () {
        [owner, user1, user2, user3] = await ethers.getSigners();

        // Deploy mock tokens
        const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
        mUSDC = await ERC20Mock.deploy("Mock USD Coin", "mUSDC", 6, ethers.parseUnits("1000000", 6));
        mBTC = await ERC20Mock.deploy("Mock Bitcoin", "mBTC", 8, ethers.parseUnits("100", 8));

        // Deploy oracle
        const PriceOracleMock = await ethers.getContractFactory("PriceOracleMock");
        oracle = await PriceOracleMock.deploy();
        await oracle.setPrice(await mUSDC.getAddress(), ethers.parseUnits("1", 8)); // $1
        await oracle.setPrice(await mBTC.getAddress(), ethers.parseUnits("50000", 8)); // $50,000

        // Deploy oracle aggregator
        const OracleAggregator = await ethers.getContractFactory("OracleAggregator");
        oracleAggregator = await OracleAggregator.deploy(owner.address);
        await oracleAggregator.addOracle(await mUSDC.getAddress(), await oracle.getAddress(), 10000);
        await oracleAggregator.addOracle(await mBTC.getAddress(), await oracle.getAddress(), 10000);

        // Deploy interest rate model
        const InterestRateModelAaveStyle = await ethers.getContractFactory("InterestRateModelAaveStyle");
        interestRateModel = await InterestRateModelAaveStyle.deploy();

        // Deploy configurator
        const PoolConfigurator = await ethers.getContractFactory("PoolConfigurator");
        configurator = await PoolConfigurator.deploy();

        // Deploy lending pool
        const LendingPool = await ethers.getContractFactory("LendingPool");
        lendingPool = await LendingPool.deploy(
            await oracle.getAddress(),
            await interestRateModel.getAddress(),
            await configurator.getAddress(),
            owner.address
        );

        // Deploy aTokens
        const AToken = await ethers.getContractFactory("AToken");
        amUSDC = await AToken.deploy("Aave mUSDC", "amUSDC", await mUSDC.getAddress(), await lendingPool.getAddress());
        amBTC = await AToken.deploy("Aave mBTC", "amBTC", await mBTC.getAddress(), await lendingPool.getAddress());

        // Deploy debt tokens
        const DebtToken = await ethers.getContractFactory("DebtToken");
        debtmUSDC = await DebtToken.deploy("Debt mUSDC", "debtmUSDC", await mUSDC.getAddress(), await lendingPool.getAddress());
        debtmBTC = await DebtToken.deploy("Debt mBTC", "debtmBTC", await mBTC.getAddress(), await lendingPool.getAddress());

        // Configure lending pool
        await lendingPool.setAToken(await mUSDC.getAddress(), await amUSDC.getAddress());
        await lendingPool.setAToken(await mBTC.getAddress(), await amBTC.getAddress());
        await lendingPool.setDebtToken(await mUSDC.getAddress(), await debtmUSDC.getAddress());
        await lendingPool.setDebtToken(await mBTC.getAddress(), await debtmBTC.getAddress());

        // Configure assets
        await configurator.configureAsset(
            await mUSDC.getAddress(),
            await oracle.getAddress(),
            7500, // LTV 75%
            8000, // Liquidation threshold 80%
            10500, // Liquidation bonus 5%
            1000, // Reserve factor 10%
            true // Active
        );

        await configurator.configureAsset(
            await mBTC.getAddress(),
            await oracle.getAddress(),
            7500, // LTV 75%
            8000, // Liquidation threshold 80%
            10500, // Liquidation bonus 5%
            1000, // Reserve factor 10%
            true // Active
        );

        // Deploy Credo Protocol features
        const FlashLoanProvider = await ethers.getContractFactory("FlashLoanProvider");
        flashLoanProvider = await FlashLoanProvider.deploy(await lendingPool.getAddress(), owner.address);

        const CredoToken = await ethers.getContractFactory("CredoToken");
        credoToken = await CredoToken.deploy(owner.address, owner.address, owner.address);

        const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
        rewardDistributor = await RewardDistributor.deploy(
            await lendingPool.getAddress(),
            await credoToken.getAddress(),
            owner.address
        );

        // Transfer tokens to users for testing
        await mUSDC.transfer(user1.address, ethers.parseUnits("10000", 6));
        await mUSDC.transfer(user2.address, ethers.parseUnits("10000", 6));
        await mBTC.transfer(user1.address, ethers.parseUnits("1", 8));
        await mBTC.transfer(user2.address, ethers.parseUnits("1", 8));
    });

    describe("Flash Loan Provider", function () {
        it("Should deploy flash loan provider correctly", async function () {
            expect(await flashLoanProvider.lendingPool()).to.equal(await lendingPool.getAddress());
            expect(await flashLoanProvider.getFlashLoanFee()).to.equal(9); // 0.09%
        });

        it("Should calculate fees correctly", async function () {
            const amount = ethers.parseUnits("1000", 6);
            const fee = await flashLoanProvider.calculateFee(amount);
            expect(fee).to.equal(ethers.parseUnits("0.9", 6)); // 0.09% of 1000
        });

        it("Should get max flash loan amount", async function () {
            // Initially no liquidity
            expect(await flashLoanProvider.getMaxFlashLoan(await mUSDC.getAddress())).to.equal(0);

            // After deposit, should have liquidity
            await mUSDC.connect(user1).approve(await lendingPool.getAddress(), ethers.parseUnits("1000", 6));
            await lendingPool.connect(user1).deposit(await mUSDC.getAddress(), ethers.parseUnits("1000", 6));

            const maxFlashLoan = await flashLoanProvider.getMaxFlashLoan(await mUSDC.getAddress());
            expect(maxFlashLoan).to.equal(ethers.parseUnits("1000", 6));
        });
    });

    describe("Credo Token (Governance)", function () {
        it("Should deploy governance token correctly", async function () {
            expect(await credoToken.name()).to.equal("CredoToken");
            expect(await credoToken.symbol()).to.equal("CREDO");
            expect(await credoToken.totalSupply()).to.equal(ethers.parseEther("1000000000")); // 1B tokens
        });

        it("Should add team member with vesting", async function () {
            const vestingAmount = ethers.parseEther("1000000"); // 1M tokens
            await credoToken.addTeamMember(user1.address, vestingAmount);

            const memberInfo = await credoToken.getTeamMemberInfo(user1.address);
            expect(memberInfo.totalAmount).to.equal(vestingAmount);
            expect(memberInfo.claimedAmount).to.equal(0);
            expect(memberInfo.startTime).to.be.greaterThan(0);
        });

        it("Should not allow claiming before cliff period", async function () {
            const vestingAmount = ethers.parseEther("1000000");
            await credoToken.addTeamMember(user1.address, vestingAmount);

            // Try to claim before cliff (1 year)
            await expect(credoToken.connect(user1).claimVestedTokens()).to.be.reverted;
        });

        it("Should update treasury and reserve addresses", async function () {
            await credoToken.updateTreasury(user1.address);
            await credoToken.updateReserve(user2.address);

            expect(await credoToken.treasury()).to.equal(user1.address);
            expect(await credoToken.reserve()).to.equal(user2.address);
        });
    });

    describe("Reward Distributor", function () {
        it("Should deploy reward distributor correctly", async function () {
            expect(await rewardDistributor.lendingPool()).to.equal(await lendingPool.getAddress());
            expect(await rewardDistributor.rewardToken()).to.equal(await credoToken.getAddress());
        });

        it("Should update reward rate", async function () {
            const newRate = ethers.parseEther("100"); // 100 tokens per second
            await rewardDistributor.updateRewardRate(newRate);
            expect(await rewardDistributor.getRewardRate()).to.equal(newRate);
        });

        it("Should set asset reward multipliers", async function () {
            const multiplier = 15000; // 1.5x multiplier
            await rewardDistributor.setAssetRewardMultiplier(await mUSDC.getAddress(), multiplier);
            expect(await rewardDistributor.getAssetRewardMultiplier(await mUSDC.getAddress())).to.equal(multiplier);
        });

        it("Should calculate pending rewards", async function () {
            // Set up reward distribution
            await rewardDistributor.updateRewardRate(ethers.parseEther("1")); // 1 token per second
            await rewardDistributor.setAssetRewardMultiplier(await mUSDC.getAddress(), 10000); // 1x multiplier

            // User deposits tokens
            await mUSDC.connect(user1).approve(await lendingPool.getAddress(), ethers.parseUnits("1000", 6));
            await lendingPool.connect(user1).deposit(await mUSDC.getAddress(), ethers.parseUnits("1000", 6));

            // Update total staked value
            await rewardDistributor.updateTotalStakedValue(ethers.parseUnits("1000", 18)); // $1000

            // Check pending rewards
            const pendingRewards = await rewardDistributor.getPendingRewards(user1.address);
            expect(pendingRewards).to.be.greaterThan(0);
        });
    });

    describe("Oracle Aggregator", function () {
        it("Should deploy oracle aggregator correctly", async function () {
            expect(await oracleAggregator.owner()).to.equal(owner.address);
        });

        it("Should add and remove oracles", async function () {
            const oracleCount = await oracleAggregator.getOracleCount(await mUSDC.getAddress());
            expect(oracleCount).to.equal(1);

            // Add another oracle
            const PriceOracleMock2 = await ethers.getContractFactory("PriceOracleMock");
            const oracle2 = await PriceOracleMock2.deploy();
            await oracleAggregator.addOracle(await mUSDC.getAddress(), await oracle2.getAddress(), 5000); // 50% weight

            const newOracleCount = await oracleAggregator.getOracleCount(await mUSDC.getAddress());
            expect(newOracleCount).to.equal(2);

            // Remove oracle
            await oracleAggregator.removeOracle(await mUSDC.getAddress(), await oracle2.getAddress());
            const finalOracleCount = await oracleAggregator.getOracleCount(await mUSDC.getAddress());
            expect(finalOracleCount).to.equal(1);
        });

        it("Should get aggregated price", async function () {
            const price = await oracleAggregator.getPrice(await mUSDC.getAddress());
            expect(price).to.equal(ethers.parseUnits("1", 8)); // $1
        });

        it("Should get token value", async function () {
            const amount = ethers.parseUnits("1000", 6); // 1000 mUSDC
            const value = await oracleAggregator.getValue(await mUSDC.getAddress(), amount, 6);
            expect(value).to.equal(ethers.parseUnits("1000", 18)); // $1000 in 18 decimals
        });

        it("Should validate price deviation", async function () {
            const isValid = await oracleAggregator.validatePriceDeviation(await mUSDC.getAddress());
            expect(isValid).to.be.true; // Single oracle, so no deviation
        });
    });

    describe("Integration Tests", function () {
        it("Should perform complete lending flow with Credo features", async function () {
            // 1. User deposits mUSDC
            await mUSDC.connect(user1).approve(await lendingPool.getAddress(), ethers.parseUnits("1000", 6));
            await lendingPool.connect(user1).deposit(await mUSDC.getAddress(), ethers.parseUnits("1000", 6));

            // 2. User deposits mBTC as collateral
            await mBTC.connect(user2).approve(await lendingPool.getAddress(), ethers.parseUnits("0.02", 8));
            await lendingPool.connect(user2).deposit(await mBTC.getAddress(), ethers.parseUnits("0.02", 8));

            // 3. User borrows mUSDC
            await lendingPool.connect(user2).borrow(await mUSDC.getAddress(), ethers.parseUnits("700", 6));

            // 4. Check health factor
            const healthFactor = await lendingPool.getHealthFactor(user2.address);
            expect(healthFactor).to.be.greaterThan(ethers.parseEther("1")); // Should be safe

            // 5. Set up reward distribution
            await rewardDistributor.updateRewardRate(ethers.parseEther("1")); // 1 token per second
            await rewardDistributor.setAssetRewardMultiplier(await mUSDC.getAddress(), 10000); // 1x multiplier
            await rewardDistributor.setAssetRewardMultiplier(await mBTC.getAddress(), 10000); // 1x multiplier

            // 6. Update total staked value for rewards
            const totalStakedValue = await lendingPool.getTotalCollateralValue(user1.address) + 
                                   await lendingPool.getTotalCollateralValue(user2.address);
            await rewardDistributor.updateTotalStakedValue(totalStakedValue);

            // 7. Check pending rewards
            const user1Rewards = await rewardDistributor.getPendingRewards(user1.address);
            const user2Rewards = await rewardDistributor.getPendingRewards(user2.address);
            expect(user1Rewards).to.be.greaterThan(0);
            expect(user2Rewards).to.be.greaterThan(0);

            // 8. Test flash loan availability
            const maxFlashLoan = await flashLoanProvider.getMaxFlashLoan(await mUSDC.getAddress());
            expect(maxFlashLoan).to.equal(ethers.parseUnits("1000", 6));

            // 9. User repays loan
            await mUSDC.connect(user2).approve(await lendingPool.getAddress(), ethers.parseUnits("700", 6));
            await lendingPool.connect(user2).repay(await mUSDC.getAddress(), ethers.parseUnits("700", 6));

            // 10. Check that collateral is auto-released
            const remainingCollateral = await lendingPool.userCollateral(user2.address, await mBTC.getAddress());
            expect(remainingCollateral).to.equal(0);
        });

        it("Should handle liquidation with enhanced features", async function () {
            // 1. User deposits mBTC as collateral
            await mBTC.connect(user1).approve(await lendingPool.getAddress(), ethers.parseUnits("0.02", 8));
            await lendingPool.connect(user1).deposit(await mBTC.getAddress(), ethers.parseUnits("0.02", 8));

            // 2. User borrows mUSDC
            await lendingPool.connect(user1).borrow(await mUSDC.getAddress(), ethers.parseUnits("700", 6));

            // 3. Simulate price drop by updating oracle
            await oracle.setPrice(await mBTC.getAddress(), ethers.parseUnits("30000", 8)); // Drop to $30,000

            // 4. Check health factor (should be below 1)
            const healthFactor = await lendingPool.getHealthFactor(user1.address);
            expect(healthFactor).to.be.lessThan(ethers.parseEther("1"));

            // 5. Liquidate position
            await mUSDC.connect(user2).approve(await lendingPool.getAddress(), ethers.parseUnits("700", 6));
            await lendingPool.connect(user2).liquidate(
                await mBTC.getAddress(),
                await mUSDC.getAddress(),
                user1.address,
                ethers.parseUnits("700", 6)
            );

            // 6. Check that liquidation was successful
            const user1Debt = await lendingPool.userBorrows(user1.address, await mUSDC.getAddress());
            expect(user1Debt).to.equal(0);
        });
    });

    describe("Access Control", function () {
        it("Should restrict owner-only functions", async function () {
            await expect(
                flashLoanProvider.connect(user1).updateFlashLoanFee(1000)
            ).to.be.revertedWithCustomError(flashLoanProvider, "OwnableUnauthorizedAccount");

            await expect(
                credoToken.connect(user1).addTeamMember(user2.address, ethers.parseEther("1000"))
            ).to.be.revertedWithCustomError(credoToken, "OwnableUnauthorizedAccount");

            await expect(
                rewardDistributor.connect(user1).updateRewardRate(ethers.parseEther("100"))
            ).to.be.revertedWithCustomError(rewardDistributor, "OwnableUnauthorizedAccount");

            await expect(
                oracleAggregator.connect(user1).addOracle(await mUSDC.getAddress(), user2.address, 10000)
            ).to.be.revertedWithCustomError(oracleAggregator, "OwnableUnauthorizedAccount");
        });
    });

    describe("Edge Cases and Error Handling", function () {
        it("Should handle zero amounts correctly", async function () {
            await expect(
                flashLoanProvider.flashLoan(await mUSDC.getAddress(), 0, user1.address, "0x")
            ).to.be.revertedWith("Amount must be greater than 0");

            await expect(
                credoToken.addTeamMember(user1.address, 0)
            ).to.be.revertedWith("Amount must be greater than 0");
        });

        it("Should handle invalid addresses correctly", async function () {
            await expect(
                flashLoanProvider.flashLoan(await mUSDC.getAddress(), ethers.parseUnits("100", 6), ethers.ZeroAddress, "0x")
            ).to.be.revertedWith("Invalid receiver address");

            await expect(
                credoToken.addTeamMember(ethers.ZeroAddress, ethers.parseEther("1000"))
            ).to.be.revertedWith("Invalid member address");
        });

        it("Should handle insufficient liquidity for flash loans", async function () {
            await expect(
                flashLoanProvider.flashLoan(await mUSDC.getAddress(), ethers.parseUnits("1000", 6), user1.address, "0x")
            ).to.be.revertedWith("Insufficient liquidity");
        });
    });
});
