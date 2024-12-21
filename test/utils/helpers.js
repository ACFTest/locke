/**
 * @file helpers.js
 * @description Utility functions for token claiming and time-related test operations
 *
 * @overview
 * Provides a suite of helper functions to support token contract testing:
 * - Time advancement utilities
 * - Previous day claim simulation
 * - Claim verification
 * - Formatting and logging helpers
 *
 * @key_features
 * - Day advancement methods
 * - Detailed claim state verification
 * - Flexible claim simulation
 * - Assertion-based claim validation
 *
 * @dependencies
 * - Hardhat Network Helpers
 * - Chai assertion library
 * - Ethers.js
 */
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// Constants for time-related calculations
const SECONDS_IN_A_DAY = 86400;

/**
 * @function advanceOneDay
 * @description Advances blockchain time by one full day
 * @returns {Promise<void>} Resolves after time advancement
 */
async function advanceOneDay() {
  const currentTime = await time.latest();
  await time.increaseTo(currentTime + SECONDS_IN_A_DAY);
}

/**
 * @function advanceDays
 * @description Advances blockchain time by specified number of days
 * @param {number} days Number of days to advance
 * @returns {Promise<void>} Resolves after time advancement
 */
async function advanceDays(days) {
  const currentTime = await time.latest();
  await time.increaseTo(currentTime + SECONDS_IN_A_DAY * days);
}

/**
 * @function simulatePreviousDayClaim
 * @description Simulates a claim for the previous day to test claim mechanics
 * @param {Object} token Token contract instance
 * @param {Object} wallet Claiming wallet
 * @param {BigNumber} amount Claim amount
 * @param {boolean} [verbose=false] Enable detailed logging
 * @returns {Promise<Object>} Previous claim and daily limit details
 */
async function simulatePreviousDayClaim(
  token,
  wallet,
  amount,
  verbose = false
) {
  if (amount.eq(0)) return;

  if (verbose) {
    console.log("\n--- DETAILED PREVIOUS DAY CLAIM SIMULATION ---");
    console.log("Target previous day claim:", ethers.utils.formatEther(amount));
  }

  const startTime = await time.latest();

  // Make initial claim
  const claimTx = await token.connect(wallet).claimTokens(amount);
  await claimTx.wait();

  // Advance one full day
  await time.increaseTo(startTime + SECONDS_IN_A_DAY);
  await ethers.provider.send("evm_mine", []);

  // Trigger day transition
  const triggerTx = await token.connect(wallet).claimTokens(0);
  await triggerTx.wait();

  // Retrieve final claim state
  const actualPreviousClaim = await token.getPreviousDayClaim();
  const maxDailyLimit = await token.getCurrentMaxDailyLimit();
  const dailyMintedAmount = await token.getDailyMintedAmount();

  if (verbose) {
    console.log("Detailed Claim State:");
    console.log(
      "- Actual Previous Day Claim:",
      ethers.utils.formatEther(actualPreviousClaim)
    );
    console.log("- Max Daily Limit:", ethers.utils.formatEther(maxDailyLimit));
    console.log(
      "- Daily Minted Amount:",
      ethers.utils.formatEther(dailyMintedAmount)
    );
    console.log("- Original Amount:", ethers.utils.formatEther(amount));
  }

  // Verify previous day claim
  expect(actualPreviousClaim).to.equal(
    amount,
    `Previous day claim does not match. 
    Expected: ${ethers.utils.formatEther(amount)} 
    Actual: ${ethers.utils.formatEther(actualPreviousClaim)}`
  );

  return { actualPreviousClaim, maxDailyLimit };
}

/**
 * @function verifyClaim
 * @description Comprehensive claim verification with detailed reporting
 * @param {Object} token Token contract instance
 * @param {Object} params Claim verification parameters
 * @returns {Promise<string>} Formatted claim verification details
 */
async function verifyClaim(token, params) {
  const {
    wallet,
    previousDayClaim = ethers.utils.parseEther("0"),
    claimAmount,
    expectedMaxDailyLimit,
    expectedActualClaim,
    expectedRemainingDayClaim,
  } = params;

  // Number formatting utility
  const formatNumber = (value) => {
    const numValue = parseFloat(ethers.utils.formatEther(value));
    return numValue.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Simulate previous day claim if applicable
  if (previousDayClaim.gt(0)) {
    await simulatePreviousDayClaim(token, wallet, previousDayClaim);
  }

  // Perform claim and track balance changes
  const initialBalance = await token.balanceOf(wallet.address);
  const tx = await token.connect(wallet).claimTokens(claimAmount);
  await tx.wait();

  const finalBalance = await token.balanceOf(wallet.address);
  const actualClaim = finalBalance.sub(initialBalance);
  const maxDailyLimit = await token.getCurrentMaxDailyLimit();

  // Create detailed test output
  const resultDetails = [
    `      - Previous Day Claims: ${formatNumber(previousDayClaim)}`,
    `      - Max Daily Limit: ${formatNumber(maxDailyLimit)}`,
    `      - Total Request Amount: ${formatNumber(claimAmount)}`,
    `      - Total Claimed: ${formatNumber(actualClaim)}`,
    `      - Unfilled Claims: ${formatNumber(claimAmount.sub(actualClaim))}`,
  ].join("\n");

  // Perform claim verification assertions
  expect(maxDailyLimit).to.equal(
    expectedMaxDailyLimit,
    "Max daily claim limit does not match expected value"
  );
  expect(actualClaim).to.equal(
    expectedActualClaim,
    "Actual claim amount does not match expected value"
  );

  // Verify remaining daily claim if specified
  if (expectedRemainingDayClaim !== undefined) {
    const claimInfo = await token.getContributorClaimInfo(wallet.address);
    expect(claimInfo.totalRemainingDayClaim).to.equal(
      expectedRemainingDayClaim,
      "Remaining daily claim does not match expected value"
    );
  }

  return resultDetails;
}

/**
 * @function addSpacing
 * @description Adds a blank line to console output for improved readability
 */
function addSpacing() {
  console.log(""); // Adds one blank line
}

module.exports = {
  SECONDS_IN_A_DAY,
  addSpacing,
  advanceOneDay,
  advanceDays,
  simulatePreviousDayClaim,
  verifyClaim,
};
