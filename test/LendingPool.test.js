const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("LendingPool", function () {
  let lendingPool, oracle, interestRateModel, configurator;
  let mUSDC, mBTC, aUSDC, aBTC, debtUSDC, debtBTC;
  let owner, lender, borrower, liquidator;
  let mUSDCAddress, mBTCAddress;

  const LENDER_ADDRESS = "0x096faDC42659Bd065F698C962b3ac0953F1dACB3";
  const BORROWER_ADDRESS = "0x6b3a924379B9408D8110f10F084ca809863B378A";

  beforeEach(async function () {
    [owner, lender, borrower, liquidator] = await ethers.getSigners();

    // Deploy mock tokens
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    mUSDC = await ERC20Mock.deploy("Mock USD Coin", "mUSDC", 6, owner.address);
    mBTC = await ERC20Mock.deploy("Mock Bitcoin", "mBTC", 8, owner.address);
    mUSDCAddress = await mUSDC.getAddress();
    mBTCAddress = await mBTC.getAddress();

    // Deploy oracle
    const PriceOracleMock = await ethers.getContractFactory("PriceOracleMock");
    oracle = await PriceOracleMock.deploy(owner.address);
    const oracleAddress = await oracle.getAddress();

    // Set prices
    await oracle.setPrices(
      [mUSDCAddress, mBTCAddress],
      [ethers.parseUnits("1", 8), ethers.parseUnits("50000", 8)]
    );

    // Deploy interest rate model
    const InterestRateModelAaveStyle = await ethers.getContractFactory("InterestRateModelAaveStyle");
    interestRateModel = await InterestRateModelAaveStyle.deploy();
    const interestRateModelAddress = await interestRateModel.getAddress();

    // Deploy configurator
    const PoolConfigurator = await ethers.getContractFactory("PoolConfigurator");
    configurator = await PoolConfigurator.deploy(owner.address);
    const configuratorAddress = await configurator.getAddress();

    // Configure assets
    await configurator.setAssetConfig(
      mUSDCAddress,
      7500, // 75% LTV
      8000, // 80% liquidation threshold
      10500, // 105% liquidation bonus
      1000, // 10% reserve factor
      true
    );

    await configurator.setAssetConfig(
      mBTCAddress,
      7500, // 75% LTV
      8000, // 80% liquidation threshold
      10500, // 105% liquidation bonus
      1000, // 10% reserve factor
      true
    );

    // Deploy lending pool
    const LendingPool = await ethers.getContractFactory("LendingPool");
    lendingPool = await LendingPool.deploy(
      oracleAddress,
      interestRateModelAddress,
      configuratorAddress,
      owner.address
    );
    const lendingPoolAddress = await lendingPool.getAddress();

    // Deploy aTokens
    const AToken = await ethers.getContractFactory("AToken");
    aUSDC = await AToken.deploy("Aave Mock USD Coin", "amUSDC", mUSDCAddress, owner.address);
    aBTC = await AToken.deploy("Aave Mock Bitcoin", "amBTC", mBTCAddress, owner.address);
    const aUSDCAddress = await aUSDC.getAddress();
    const aBTCAddress = await aBTC.getAddress();

    // Deploy debt tokens
    const DebtToken = await ethers.getContractFactory("DebtToken");
    debtUSDC = await DebtToken.deploy("Debt Mock USD Coin", "debtmUSDC", mUSDCAddress, owner.address);
    debtBTC = await DebtToken.deploy("Debt Mock Bitcoin", "debtmBTC", mBTCAddress, owner.address);
    const debtUSDCAddress = await debtUSDC.getAddress();
    const debtBTCAddress = await debtBTC.getAddress();

    // Configure lending pool
    await lendingPool.setAToken(mUSDCAddress, aUSDCAddress);
    await lendingPool.setAToken(mBTCAddress, aBTCAddress);
    await lendingPool.setDebtToken(mUSDCAddress, debtUSDCAddress);
    await lendingPool.setDebtToken(mBTCAddress, debtBTCAddress);

    // Set lending pool in tokens
    await aUSDC.setLendingPool(lendingPoolAddress);
    await aBTC.setLendingPool(lendingPoolAddress);
    await debtUSDC.setLendingPool(lendingPoolAddress);
    await debtBTC.setLendingPool(lendingPoolAddress);

    // Mint test tokens
    await mUSDC.mint(LENDER_ADDRESS, ethers.parseUnits("500000", 6));
    await mBTC.mint(BORROWER_ADDRESS, ethers.parseUnits("5", 8));
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await lendingPool.owner()).to.equal(owner.address);
    });

    it("Should set the correct oracle", async function () {
      expect(await lendingPool.oracle()).to.equal(await oracle.getAddress());
    });

    it("Should set the correct interest rate model", async function () {
      expect(await lendingPool.interestRateModel()).to.equal(await interestRateModel.getAddress());
    });

    it("Should set the correct configurator", async function () {
      expect(await lendingPool.configurator()).to.equal(await configurator.getAddress());
    });
  });

  describe("Deposit", function () {
    it("Should allow users to deposit tokens", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      
      // Approve tokens
      await mUSDC.connect(lender).approve(await lendingPool.getAddress(), depositAmount);
      
      // Deposit
      await expect(lendingPool.connect(lender).deposit(mUSDCAddress, depositAmount))
        .to.emit(lendingPool, "Deposit")
        .withArgs(lender.address, mUSDCAddress, depositAmount, depositAmount);

      // Check balances
      expect(await mUSDC.balanceOf(lender.address)).to.equal(ethers.parseUnits("499000", 6));
      expect(await aUSDC.balanceOf(lender.address)).to.equal(depositAmount);
      expect(await lendingPool.totalSupplied(mUSDCAddress)).to.equal(depositAmount);
    });

    it("Should revert if asset is not supported", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      await expect(lendingPool.connect(lender).deposit(ethers.ZeroAddress, depositAmount))
        .to.be.revertedWith("Asset not supported");
    });

    it("Should revert if amount is zero", async function () {
      await expect(lendingPool.connect(lender).deposit(mUSDCAddress, 0))
        .to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      await mUSDC.connect(lender).approve(await lendingPool.getAddress(), depositAmount);
      await lendingPool.connect(lender).deposit(mUSDCAddress, depositAmount);
    });

    it("Should allow users to withdraw tokens", async function () {
      const withdrawAmount = ethers.parseUnits("500", 6);
      
      await expect(lendingPool.connect(lender).withdraw(mUSDCAddress, withdrawAmount))
        .to.emit(lendingPool, "Withdraw")
        .withArgs(lender.address, mUSDCAddress, withdrawAmount, withdrawAmount);

      // Check balances
      expect(await mUSDC.balanceOf(lender.address)).to.equal(ethers.parseUnits("499500", 6));
      expect(await aUSDC.balanceOf(lender.address)).to.equal(ethers.parseUnits("500", 6));
      expect(await lendingPool.totalSupplied(mUSDCAddress)).to.equal(ethers.parseUnits("500", 6));
    });

    it("Should revert if insufficient collateral", async function () {
      const withdrawAmount = ethers.parseUnits("2000", 6);
      await expect(lendingPool.connect(lender).withdraw(mUSDCAddress, withdrawAmount))
        .to.be.revertedWith("Insufficient collateral");
    });
  });

  describe("Borrow", function () {
    beforeEach(async function () {
      // Lender deposits mUSDC
      const depositAmount = ethers.parseUnits("10000", 6);
      await mUSDC.connect(lender).approve(await lendingPool.getAddress(), depositAmount);
      await lendingPool.connect(lender).deposit(mUSDCAddress, depositAmount);

      // Borrower deposits mBTC as collateral
      const collateralAmount = ethers.parseUnits("0.02", 8);
      await mBTC.connect(borrower).approve(await lendingPool.getAddress(), collateralAmount);
      await lendingPool.connect(borrower).deposit(mBTCAddress, collateralAmount);
    });

    it("Should allow users to borrow tokens", async function () {
      const borrowAmount = ethers.parseUnits("700", 6);
      
      await expect(lendingPool.connect(borrower).borrow(mUSDCAddress, borrowAmount))
        .to.emit(lendingPool, "Borrow")
        .withArgs(borrower.address, mUSDCAddress, borrowAmount, borrowAmount);

      // Check balances
      expect(await mUSDC.balanceOf(borrower.address)).to.equal(borrowAmount);
      expect(await debtUSDC.balanceOf(borrower.address)).to.equal(borrowAmount);
      expect(await lendingPool.totalBorrowed(mUSDCAddress)).to.equal(borrowAmount);
    });

    it("Should revert if health factor too low", async function () {
      const borrowAmount = ethers.parseUnits("1000", 6);
      await expect(lendingPool.connect(borrower).borrow(mUSDCAddress, borrowAmount))
        .to.be.revertedWith("Health factor too low");
    });

    it("Should revert if insufficient liquidity", async function () {
      const borrowAmount = ethers.parseUnits("20000", 6);
      await expect(lendingPool.connect(borrower).borrow(mUSDCAddress, borrowAmount))
        .to.be.revertedWith("Insufficient liquidity");
    });
  });

  describe("Repay", function () {
    beforeEach(async function () {
      // Setup borrowing scenario
      const depositAmount = ethers.parseUnits("10000", 6);
      await mUSDC.connect(lender).approve(await lendingPool.getAddress(), depositAmount);
      await lendingPool.connect(lender).deposit(mUSDCAddress, depositAmount);

      const collateralAmount = ethers.parseUnits("0.02", 8);
      await mBTC.connect(borrower).approve(await lendingPool.getAddress(), collateralAmount);
      await lendingPool.connect(borrower).deposit(mBTCAddress, collateralAmount);

      const borrowAmount = ethers.parseUnits("700", 6);
      await lendingPool.connect(borrower).borrow(mUSDCAddress, borrowAmount);
    });

    it("Should allow users to repay debt", async function () {
      const repayAmount = ethers.parseUnits("350", 6);
      
      await mUSDC.connect(borrower).approve(await lendingPool.getAddress(), repayAmount);
      
      await expect(lendingPool.connect(borrower).repay(mUSDCAddress, repayAmount))
        .to.emit(lendingPool, "Repay")
        .withArgs(borrower.address, mUSDCAddress, repayAmount, repayAmount);

      // Check balances
      expect(await mUSDC.balanceOf(borrower.address)).to.equal(ethers.parseUnits("350", 6));
      expect(await debtUSDC.balanceOf(borrower.address)).to.equal(ethers.parseUnits("350", 6));
      expect(await lendingPool.totalBorrowed(mUSDCAddress)).to.equal(ethers.parseUnits("350", 6));
    });

    it("Should revert if no debt to repay", async function () {
      const repayAmount = ethers.parseUnits("100", 6);
      await mUSDC.connect(lender).approve(await lendingPool.getAddress(), repayAmount);
      
      await expect(lendingPool.connect(lender).repay(mUSDCAddress, repayAmount))
        .to.be.revertedWith("No debt to repay");
    });
  });

  describe("Interest Accrual", function () {
    beforeEach(async function () {
      // Setup borrowing scenario
      const depositAmount = ethers.parseUnits("10000", 6);
      await mUSDC.connect(lender).approve(await lendingPool.getAddress(), depositAmount);
      await lendingPool.connect(lender).deposit(mUSDCAddress, depositAmount);

      const collateralAmount = ethers.parseUnits("0.02", 8);
      await mBTC.connect(borrower).approve(await lendingPool.getAddress(), collateralAmount);
      await lendingPool.connect(borrower).deposit(mBTCAddress, collateralAmount);

      const borrowAmount = ethers.parseUnits("700", 6);
      await lendingPool.connect(borrower).borrow(mUSDCAddress, borrowAmount);
    });

    it("Should accrue interest over time", async function () {
      const initialBorrowed = await lendingPool.totalBorrowed(mUSDCAddress);
      const initialSupplied = await lendingPool.totalSupplied(mUSDCAddress);

      // Advance time by 30 days
      await time.increase(30 * 24 * 60 * 60);

      // Trigger interest accrual by making a deposit
      const smallDeposit = ethers.parseUnits("1", 6);
      await mUSDC.connect(lender).approve(await lendingPool.getAddress(), smallDeposit);
      await lendingPool.connect(lender).deposit(mUSDCAddress, smallDeposit);

      const finalBorrowed = await lendingPool.totalBorrowed(mUSDCAddress);
      const finalSupplied = await lendingPool.totalSupplied(mUSDCAddress);

      expect(finalBorrowed).to.be.gt(initialBorrowed);
      expect(finalSupplied).to.be.gt(initialSupplied);
    });
  });

  describe("Health Factor", function () {
    beforeEach(async function () {
      // Setup borrowing scenario
      const depositAmount = ethers.parseUnits("10000", 6);
      await mUSDC.connect(lender).approve(await lendingPool.getAddress(), depositAmount);
      await lendingPool.connect(lender).deposit(mUSDCAddress, depositAmount);

      const collateralAmount = ethers.parseUnits("0.02", 8);
      await mBTC.connect(borrower).approve(await lendingPool.getAddress(), collateralAmount);
      await lendingPool.connect(borrower).deposit(mBTCAddress, collateralAmount);
    });

    it("Should calculate health factor correctly", async function () {
      const healthFactor = await lendingPool.getHealthFactor(borrower.address);
      expect(healthFactor).to.be.gt(0);
    });

    it("Should return infinite health factor for users with no debt", async function () {
      const healthFactor = await lendingPool.getHealthFactor(lender.address);
      expect(healthFactor).to.equal(ethers.MaxUint256);
    });
  });

  describe("Liquidation", function () {
    beforeEach(async function () {
      // Setup borrowing scenario
      const depositAmount = ethers.parseUnits("10000", 6);
      await mUSDC.connect(lender).approve(await lendingPool.getAddress(), depositAmount);
      await lendingPool.connect(lender).deposit(mUSDCAddress, depositAmount);

      const collateralAmount = ethers.parseUnits("0.02", 8);
      await mBTC.connect(borrower).approve(await lendingPool.getAddress(), collateralAmount);
      await lendingPool.connect(borrower).deposit(mBTCAddress, collateralAmount);

      const borrowAmount = ethers.parseUnits("700", 6);
      await lendingPool.connect(borrower).borrow(mUSDCAddress, borrowAmount);
    });

    it("Should allow liquidation when health factor is low", async function () {
      // Lower mBTC price to make position liquidatable
      await oracle.setPrice(mBTCAddress, ethers.parseUnits("35000", 8)); // 30% price drop

      const debtAmount = ethers.parseUnits("100", 6);
      await mUSDC.connect(liquidator).approve(await lendingPool.getAddress(), debtAmount);

      await expect(lendingPool.connect(liquidator).liquidate(
        mBTCAddress,
        mUSDCAddress,
        borrower.address,
        debtAmount
      )).to.emit(lendingPool, "Liquidation");
    });

    it("Should revert if borrower is not liquidatable", async function () {
      const debtAmount = ethers.parseUnits("100", 6);
      await mUSDC.connect(liquidator).approve(await lendingPool.getAddress(), debtAmount);

      await expect(lendingPool.connect(liquidator).liquidate(
        mBTCAddress,
        mUSDCAddress,
        borrower.address,
        debtAmount
      )).to.be.revertedWith("Borrower not liquidatable");
    });
  });
});



