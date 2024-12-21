/**
 * @file Token.errors.test.js
 * @description Comprehensive error handling test suite for Token contract
 *
 * @overview
 * Validates critical error scenarios in the token claiming mechanism:
 * - Preventing unauthorized token claims
 * - Enforcing token allocation limits
 * - Managing daily claim restrictions
 * - Handling edge cases and invalid claim scenarios
 *
 * @key_features
 * - Wallet authorization validation
 * - Allocation limit enforcement
 * - Daily claim limit checks
 * - Invalid claim prevention
 *
 * @test_constants
 * - DAILY_BASE_SUPPLY: 50,000,000 tokens (base daily limit)
 * - ALLOCATION: 1,000,000,000 tokens (contributor allocation)
 *
 * @dependencies
 * - Chai assertion library
 * - Hardhat Ethereum testing framework
 * - Custom test setup utilities
 */
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { setupTest } = require("../utils/setup");
const { advanceDays } = require("../utils/helpers");

describe("Token: Error Handling", function () {
  // Test suite variables
  let token, owner, wallet1, wallet2;

  // Predefined token allocation constants
  const DAILY_BASE_SUPPLY = ethers.utils.parseEther("50000000"); // 50M tokens
  const ALLOCATION = ethers.utils.parseEther("1000000000"); // 1B tokens

  /**
   * @description Setup routine for each test case
   * Initializes token contract and prepares test wallets
   */
  beforeEach(async function () {
    ({ token, owner, wallet1, wallet2 } = await setupTest());
  });

  /**
   * @test Unauthorized Wallet Claims
   * @description Validates prevention of token claims from unauthorized wallets
   *
   * Test Scenarios:
   * - Add a contributor with a specific wallet
   * - Attempt to claim tokens from an unauthorized wallet
   * - Verify claim is rejected with "Unauthorized wallet" error
   */
  it("Should prevent unauthorized wallet claims", async function () {
    await token
      .connect(owner)
      .addOrUpdateContributor(
        wallet1.address,
        "Contributor1",
        [wallet1.address],
        ALLOCATION
      );

    await expect(
      token.connect(wallet2).claimTokens(ethers.utils.parseEther("1000"))
    ).to.be.revertedWith("Unauthorized wallet");
  });

  /**
   * @test Allocation Limit Enforcement
   * @description Ensures contributors cannot claim tokens beyond their allocation
   *
   * Test Scenarios:
   * - Add contributor with limited token allocation
   * - Attempt to claim tokens exceeding allocated amount
   * - Verify claim is rejected with "Exceeds allocation" error
   */
  it("Should prevent claims exceeding allocation", async function () {
    // Small allocation of 30M tokens
    const smallAllocation = ethers.utils.parseEther("30000000");

    await token
      .connect(owner)
      .addOrUpdateContributor(
        wallet1.address,
        "Contributor1",
        [wallet1.address],
        smallAllocation
      );

    await expect(
      token.connect(wallet1).claimTokens(ethers.utils.parseEther("40000000"))
    ).to.be.revertedWith("Exceeds allocation");
  });

  /**
   * @test Daily Claim Limit Exhaustion
   * @description Validates prevention of claims when daily token limit is reached
   *
   * Test Scenarios:
   * - Add contributor
   * - Claim entire daily base supply
   * - Attempt to claim additional tokens
   * - Verify claim is rejected with "No tokens available today" error
   */
  it("Should prevent claims when daily limit is exhausted", async function () {
    await token
      .connect(owner)
      .addOrUpdateContributor(
        wallet1.address,
        "Contributor1",
        [wallet1.address],
        ALLOCATION
      );

    await token.connect(wallet1).claimTokens(DAILY_BASE_SUPPLY);

    await expect(
      token.connect(wallet1).claimTokens(ethers.utils.parseEther("1"))
    ).to.be.revertedWith("No tokens available today");
  });

  /**
   * @test Daily Limit Reset Mechanism
   * @description Verifies daily claim limit resets after multiple skipped days
   *
   * Test Scenarios:
   * - Add contributor
   * - Claim partial tokens
   * - Advance multiple days
   * - Confirm daily claim limit resets to base supply
   */
  it("Should reset daily limit after skipped days", async function () {
    await token
      .connect(owner)
      .addOrUpdateContributor(
        wallet1.address,
        "Contributor1",
        [wallet1.address],
        ALLOCATION
      );

    await token
      .connect(wallet1)
      .claimTokens(ethers.utils.parseEther("40000000"));

    await advanceDays(3);

    const claimInfo = await token.getContributorClaimInfo(wallet1.address);
    expect(claimInfo.maxDailyClaimLimit).to.equal(DAILY_BASE_SUPPLY);
  });

  /**
   * @test Invalid Claim Amount Handling
   * @description Ensures contract robustly handles extremely large claim amounts
   *
   * Test Scenarios:
   * - Add contributor
   * - Attempt to claim maximum possible uint256 value
   * - Verify transaction is rejected
   */
  it("Should handle invalid claim amounts", async function () {
    await token
      .connect(owner)
      .addOrUpdateContributor(
        wallet1.address,
        "Contributor1",
        [wallet1.address],
        ALLOCATION
      );

    await expect(
      token.connect(wallet1).claimTokens(ethers.constants.MaxUint256)
    ).to.be.reverted;
  });
});
