/**
 * @file Token.claims.test.js
 * @description Comprehensive integration test suite for Locke Token's daily claiming mechanism
 *
 * @overview
 * This test suite validates the token contract's dynamic daily claim limit functionality.
 * It demonstrates how the token contract handles various claiming scenarios:
 * - Base daily claim limits
 * - Carry-over of previous day's claims
 * - Partial and full claims
 * - Incremental limit adjustments
 *
 * @key_features
 * - Daily base supply of 50M tokens
 * - Dynamic daily claim limit calculation
 * - Incremental limit expansion based on previous day's claims
 * - Partial claim handling when daily limit is exceeded
 *
 * @test_constants
 * - DAILY_BASE_SUPPLY: 50,000,000 tokens (base daily limit)
 * - ALLOCATION: 1,000,000,000 tokens per contributor (total allocation)
 *
 * @dependencies
 * - Hardhat Ethereum testing framework
 * - Custom utility functions for test setup and verification
 */
const { ethers } = require("hardhat");
const { setupTest } = require("../utils/setup");
const {
  verifyClaim,
  addSpacing,
  advanceOneDay,
  advanceDays,
} = require("../utils/helpers");

describe("Token: Daily Claim Scenarios", function () {
  // Test suite variables
  let token, owner, wallet1, wallet2;

  // Predefined token allocation constants
  const DAILY_BASE_SUPPLY = ethers.utils.parseEther("50000000"); // 50M tokens
  const ALLOCATION = ethers.utils.parseEther("1000000000"); // 1B tokens per contributor

  /**
   * @description Setup routine for each test case
   * - Initializes token contract
   * - Adds two contributors with full token allocations
   * - Ensures clean state for each test scenario
   */
  beforeEach(async function () {
    // Setup test environment with token contract and wallets
    ({ token, owner, wallet1, wallet2 } = await setupTest());

    // Prepare contributors with full token allocations
    await token
      .connect(owner)
      .addOrUpdateContributor(
        wallet1.address,
        "Contributor1",
        [wallet1.address],
        ALLOCATION
      );
    await token
      .connect(owner)
      .addOrUpdateContributor(
        wallet2.address,
        "Contributor2",
        [wallet2.address],
        ALLOCATION
      );
  });

  /**
   * @test Example 1: Base Claim Limit Scenario
   * @description Validates basic daily claim functionality
   * Scenario:
   * - Day 1: 10M tokens claimed
   * - Base daily limit: 50M tokens
   * - Verifies full claim processing
   */
  it("Example 1: Base Claim Limit with 10M Claims", async function () {
    const claimAmount = ethers.utils.parseEther("10000000"); // 10M

    const resultDetails = await verifyClaim(token, {
      wallet: wallet1,
      day: 1,
      testDescription: "Base Claim Limit with 10M Claims",
      claimAmount: claimAmount,
      expectedMaxDailyLimit: DAILY_BASE_SUPPLY,
      expectedActualClaim: claimAmount,
      expectedRemainingDayClaim: DAILY_BASE_SUPPLY.sub(claimAmount),
    });

    this.test.title += `\n${resultDetails}`;
    addSpacing(); // Adds visual spacing between test outputs
  });

  /**
   * @test Example 2: Previous Day Claims Impact
   * @description Demonstrates how previous day's claims affect daily limit
   * Scenario:
   * - Day 1: 10M tokens claimed
   * - Day 2: No claims
   * - Verifies daily limit increases to 60M
   */
  it("Example 2: Previous Day Claims with No Current Claims", async function () {
    // Claim 10M tokens on Day 1
    await token
      .connect(wallet1)
      .claimTokens(ethers.utils.parseEther("10000000"));

    // Advance to Day 2
    await advanceOneDay();

    // Calculate new daily limit (base + previous day claims)
    const day2Limit = DAILY_BASE_SUPPLY.add(
      ethers.utils.parseEther("10000000")
    );

    const resultDetails = await verifyClaim(token, {
      wallet: wallet2,
      day: 2,
      testDescription: "Previous Day Claims with No Current Claims",
      previousDayClaim: ethers.utils.parseEther("10000000"),
      claimAmount: ethers.utils.parseEther("0"),
      expectedMaxDailyLimit: day2Limit,
      expectedActualClaim: ethers.utils.parseEther("0"),
      expectedRemainingDayClaim: day2Limit,
    });

    this.test.title += `\n${resultDetails}`;
    addSpacing();
  });

  /**
   * @test Example 3: Base Claim Limit with Larger Claim
   * @description Validates claiming 25M tokens on a fresh day
   * Scenario:
   * - Day 3: 25M tokens claimed
   * - Base daily limit: 50M tokens
   * - Verifies full claim processing
   */
  it("Example 3: Base Claim Limit with 25M Claims", async function () {
    // Advance 2 days to reset previous claims
    await advanceDays(2);

    const claimAmount = ethers.utils.parseEther("25000000"); // 25M

    const resultDetails = await verifyClaim(token, {
      wallet: wallet1,
      day: 3,
      testDescription: "Base Claim Limit with 25M Claims",
      claimAmount: claimAmount,
      expectedMaxDailyLimit: DAILY_BASE_SUPPLY,
      expectedActualClaim: claimAmount,
      expectedRemainingDayClaim: DAILY_BASE_SUPPLY.sub(claimAmount),
    });

    this.test.title += `\n${resultDetails}`;
    addSpacing();
  });

  /**
   * @test Example 4: Partial Claims with Increased Limit
   * @description Demonstrates partial claim when daily limit is exceeded
   * Scenario:
   * - Day 3: 25M tokens claimed
   * - Day 4: Attempt to claim 95M tokens
   * - Verifies partial claim of 75M tokens
   */
  it("Example 4: Partial Claims with Increased Limit", async function () {
    // Advance 2 days
    await advanceDays(2);

    // Claim 25M on Day 3
    await token
      .connect(wallet1)
      .claimTokens(ethers.utils.parseEther("25000000"));

    // Advance to Day 4
    await advanceOneDay();

    // Calculate new daily limit
    const day4Limit = DAILY_BASE_SUPPLY.add(
      ethers.utils.parseEther("25000000")
    );

    // Attempt to claim 95M tokens
    const attemptedClaim = ethers.utils.parseEther("95000000");
    const expectedClaim = ethers.utils.parseEther("75000000");

    const resultDetails = await verifyClaim(token, {
      wallet: wallet2,
      day: 4,
      testDescription: "Partial Claims with Increased Limit",
      previousDayClaim: ethers.utils.parseEther("25000000"),
      claimAmount: attemptedClaim,
      expectedMaxDailyLimit: day4Limit,
      expectedActualClaim: expectedClaim,
      expectedRemainingDayClaim: ethers.utils.parseEther("0"),
    });

    this.test.title += `\n${resultDetails}`;
    addSpacing();
  });

  /**
   * @test Example 5: Full Claim within Increased Limit
   * @description Validates claiming tokens when daily limit is expanded
   * Scenario:
   * - Days 1-3: Incremental claims by wallet1
   * - Day 5: Claim 120M tokens
   * - Verifies full claim within expanded limit
   */
  it("Example 5: Full Claim within Increased Limit", async function () {
    // Simulate claims over multiple days
    await token
      .connect(wallet1)
      .claimTokens(ethers.utils.parseEther("25000000")); // Day 1
    await advanceOneDay();

    await token
      .connect(wallet1)
      .claimTokens(ethers.utils.parseEther("50000000")); // Day 2
    await advanceOneDay();

    await token
      .connect(wallet1)
      .claimTokens(ethers.utils.parseEther("75000000")); // Day 3
    await advanceOneDay();

    // Calculate new daily limit
    const day5Limit = DAILY_BASE_SUPPLY.add(
      ethers.utils.parseEther("75000000")
    );
    const claimAmount = ethers.utils.parseEther("120000000");

    const resultDetails = await verifyClaim(token, {
      wallet: wallet2,
      day: 5,
      testDescription: "Full Claim within Increased Limit",
      previousDayClaim: ethers.utils.parseEther("75000000"),
      claimAmount: claimAmount,
      expectedMaxDailyLimit: day5Limit,
      expectedActualClaim: claimAmount,
      expectedRemainingDayClaim: day5Limit.sub(claimAmount),
    });

    this.test.title += `\n${resultDetails}`;
    addSpacing();
  });

  /**
   * @test Example 6: Partial Claims with High Limit
   * @description Demonstrates complex claim scenario with multiple day claims
   * Scenario:
   * - Days 1-5: Incremental claims by wallet1
   * - Day 6: Attempt to claim 200M tokens
   * - Verifies partial claim of 170M tokens
   */
  it("Example 6: Partial Claims with High Limit", async function () {
    // Simulate claims over multiple days
    await token
      .connect(wallet1)
      .claimTokens(ethers.utils.parseEther("25000000")); // Day 1
    await advanceOneDay();

    await token
      .connect(wallet1)
      .claimTokens(ethers.utils.parseEther("50000000")); // Day 2
    await advanceOneDay();

    await token
      .connect(wallet1)
      .claimTokens(ethers.utils.parseEther("75000000")); // Day 3
    await advanceOneDay();

    await token
      .connect(wallet1)
      .claimTokens(ethers.utils.parseEther("100000000")); // Day 4
    await advanceOneDay();

    await token
      .connect(wallet1)
      .claimTokens(ethers.utils.parseEther("120000000")); // Day 5
    await advanceOneDay();

    // Calculate new daily limit
    const day6Limit = DAILY_BASE_SUPPLY.add(
      ethers.utils.parseEther("120000000")
    );

    // Attempt to claim 200M tokens
    const attemptedClaim = ethers.utils.parseEther("200000000");
    const expectedClaim = ethers.utils.parseEther("170000000");

    const resultDetails = await verifyClaim(token, {
      wallet: wallet2,
      day: 6,
      testDescription: "Partial Claims with High Limit",
      previousDayClaim: ethers.utils.parseEther("120000000"),
      claimAmount: attemptedClaim,
      expectedMaxDailyLimit: day6Limit,
      expectedActualClaim: expectedClaim,
      expectedRemainingDayClaim: ethers.utils.parseEther("0"),
    });

    this.test.title += `\n${resultDetails}`;
    addSpacing();
  });

  /**
   * @test Example 7: Full Claim with Very High Limit
   * @description Tests claiming tokens with an extremely high accumulated limit
   * Scenario:
   * - Days 1-6: Incremental claims by wallet1
   * - Day 7: Claim 210M tokens
   * - Verifies full claim within expanded limit
   */
  it("Example 7: Full Claim with Very High Limit", async function () {
    // Simulate claims over multiple days
    await token
      .connect(wallet1)
      .claimTokens(ethers.utils.parseEther("25000000")); // Day 1
    await advanceOneDay();

    await token
      .connect(wallet1)
      .claimTokens(ethers.utils.parseEther("50000000")); // Day 2
    await advanceOneDay();

    await token
      .connect(wallet1)
      .claimTokens(ethers.utils.parseEther("75000000")); // Day 3
    await advanceOneDay();

    await token
      .connect(wallet1)
      .claimTokens(ethers.utils.parseEther("100000000")); // Day 4
    await advanceOneDay();

    await token
      .connect(wallet1)
      .claimTokens(ethers.utils.parseEther("120000000")); // Day 5
    await advanceOneDay();

    await token
      .connect(wallet1)
      .claimTokens(ethers.utils.parseEther("175000000")); // Day 6
    await advanceOneDay();

    // Calculate new daily limit
    const day7Limit = DAILY_BASE_SUPPLY.add(
      ethers.utils.parseEther("175000000")
    );
    const claimAmount = ethers.utils.parseEther("210000000");

    const resultDetails = await verifyClaim(token, {
      wallet: wallet2,
      day: 7,
      testDescription: "Full Claim with Very High Limit",
      previousDayClaim: ethers.utils.parseEther("175000000"),
      claimAmount: claimAmount,
      expectedMaxDailyLimit: day7Limit,
      expectedActualClaim: claimAmount,
      expectedRemainingDayClaim: day7Limit.sub(claimAmount),
    });

    this.test.title += `\n${resultDetails}`;
    addSpacing();
  });
});
