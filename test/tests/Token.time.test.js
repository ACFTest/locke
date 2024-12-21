/**
 * @file Token.time.test.js
 * @description Comprehensive test suite for Time and DST Handling
 *
 * @overview
 * Validates critical time-related functionalities:
 * - Days elapsed calculation
 * - UTC to Mountain Time conversion
 * - Daylight Savings Time (DST) transitions
 * - Time boundary consistency
 * - Manual DST Override functionality
 *
 * @key_features
 * - Accurate days elapsed tracking
 * - UTC to Mountain Time conversion
 * - DST offset handling
 * - Time boundary preservation
 * - Manual DST override handling
 *
 * @dependencies
 * - Chai assertion library
 * - Hardhat Network Helpers
 * - Custom time-related utilities
 */
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { setupTest } = require("../utils/setup");
const { SECONDS_IN_A_DAY } = require("../utils/helpers");

describe("Token: Time and DST Handling", function () {
  // Test suite variables
  let token, owner;

  /**
   * @description Setup routine for each test case
   * Initializes token contract and prepares test environment
   */
  beforeEach(async function () {
    ({ token, owner } = await setupTest());
  });

  /**
   * @test Days Elapsed Calculation
   * @description Validates accurate tracking of elapsed days
   *
   * Test Scenarios:
   * - Verify zero days elapsed at initial timestamp
   * - Check days elapsed after one day
   * - Verify days elapsed across multiple days
   */
  it("Should calculate days elapsed correctly", async function () {
    const initialTimestamp = await time.latest();

    expect(await token.daysElapsed(initialTimestamp)).to.equal(0);

    await time.increaseTo(initialTimestamp + SECONDS_IN_A_DAY);
    expect(await token.daysElapsed(initialTimestamp)).to.equal(1);

    await time.increaseTo(initialTimestamp + SECONDS_IN_A_DAY * 4);
    expect(await token.daysElapsed(initialTimestamp)).to.equal(4);
  });

  /**
   * @test UTC to Mountain Time Conversion
   * @description Validates conversion from UTC to Mountain Time
   *
   * Test Scenarios:
   * - Convert UTC timestamp to Mountain Time
   * - Verify timestamp is reduced
   * - Check UTC offset is either -6 or -7 hours
   */
  it("Should convert UTC to Mountain Time correctly", async function () {
    const utcTimestamp = await time.latest();
    const mountainTime = await token.toMountainTime(utcTimestamp);
    const currentOffset = await token.getCurrentUTCOffset();

    expect(mountainTime).to.be.lt(utcTimestamp);
    const offsetHours = currentOffset.div(-3600);
    expect(offsetHours.toNumber()).to.be.oneOf([6, 7]);
  });

  /**
   * @test Day Boundary Consistency
   * @description Ensures consistent day tracking across time changes
   *
   * Test Scenarios:
   * - Track initial days elapsed
   * - Advance time by one day
   * - Verify consistent day increment
   */
  it("Should maintain consistent day boundaries across DST changes", async function () {
    const startTime = await time.latest();
    const initialDays = await token.daysElapsed(startTime);

    await time.increaseTo(startTime + SECONDS_IN_A_DAY);
    const daysAfter = await token.daysElapsed(startTime);

    expect(daysAfter.sub(initialDays)).to.equal(1);
  });

  /**
   * @description Nested describe block for DST Transition Testing
   * Validates Daylight Savings Time offset changes
   */
  describe("DST Transitions", function () {
    /**
     * @test DST Start Transition
     * @description Verifies correct UTC offset during DST start
     *
     * Test Scenarios:
     * - Set timestamp to DST start
     * - Confirm offset changes to -6 hours
     */
    it("Should handle DST start transition", async function () {
      const dstStart = await token.getDSTStatus();
      await time.increaseTo(dstStart.dstStart);

      const offset = await token.getCurrentUTCOffset();
      expect(offset.div(-3600)).to.equal(6); // -6 hours during DST
    });

    /**
     * @test DST End Transition
     * @description Verifies correct UTC offset during DST end
     *
     * Test Scenarios:
     * - Set timestamp to DST end
     * - Confirm offset changes to -7 hours
     */
    it("Should handle DST end transition", async function () {
      const dstEnd = await token.getDSTStatus();
      await time.increaseTo(dstEnd.dstEnd);

      const offset = await token.getCurrentUTCOffset();
      expect(offset.div(-3600)).to.equal(7); // -7 hours outside DST
    });
  });

  /**
   * @description Nested describe block for Manual DST Override Testing
   */
  describe("Manual DST Override", function () {
    it("Should activate manual override and set DST active", async function () {
      await token.connect(owner).setManualDSTOverride(true, true); // Enable manual override with DST active
      const dstStatus = await token.getDSTStatus();

      expect(dstStatus.isManualOverride).to.be.true;
      expect(dstStatus.isDaylightSavingsActive).to.be.true;

      const offset = await token.getCurrentUTCOffset();
      expect(offset.div(-3600)).to.equal(6); // -6 hours during DST
    });

    it("Should activate manual override and set DST inactive", async function () {
      await token.connect(owner).setManualDSTOverride(true, false); // Enable manual override with DST inactive
      const dstStatus = await token.getDSTStatus();

      expect(dstStatus.isManualOverride).to.be.true;
      expect(dstStatus.isDaylightSavingsActive).to.be.false;

      const offset = await token.getCurrentUTCOffset();
      expect(offset.div(-3600)).to.equal(7); // -7 hours outside DST
    });

    it("Should disable manual override and revert to automatic DST", async function () {
      // Activate manual override first
      await token.connect(owner).setManualDSTOverride(true, true);

      // Disable manual override
      await token.connect(owner).setManualDSTOverride(false, false);

      const dstStatus = await token.getDSTStatus();
      expect(dstStatus.isManualOverride).to.be.false;

      // Verify that automatic DST logic is used
      const currentTimestamp = await time.latest();
      const offset = await token.getCurrentUTCOffset();

      if (
        currentTimestamp >= dstStatus.dstStart &&
        currentTimestamp < dstStatus.dstEnd
      ) {
        expect(offset.div(-3600)).to.equal(6); // -6 hours during DST
      } else {
        expect(offset.div(-3600)).to.equal(7); // -7 hours outside DST
      }
    });
  });
});
