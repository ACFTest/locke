/**
 * @file Token.contributor.test.js
 * @description Integration test suite for Locke Token's Contributor Management
 *
 * @overview
 * This test suite validates the contributor management functionality of the token contract:
 * - Adding contributors with single and multiple wallets
 * - Enforcing wallet count constraints
 * - Verifying contributor information retrieval
 *
 * @key_features
 * - Contributors can have 1-3 wallet addresses
 * - Owner can add/update contributor accounts
 * - Immutable contributor identification
 * - Token allocation shared across registered wallets
 *
 * @test_constants
 * - ALLOCATION: 1,000,000 tokens per contributor
 *
 * @dependencies
 * - Chai assertion library
 * - Hardhat Ethereum testing framework
 * - Custom test setup utilities
 */
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { setupTest } = require("../utils/setup");

describe("Token: Contributor Management", function () {
  // Test suite variables
  let token, owner, wallet1, wallet2, wallet3, contributor2;

  // Contributor token allocation constant
  const ALLOCATION = ethers.utils.parseEther("1000000"); // 1M tokens

  /**
   * @description Setup routine for each test case
   * - Initializes token contract
   * - Prepares test wallets
   * - Ensures clean state for each test scenario
   */
  beforeEach(async function () {
    ({ token, owner, wallet1, wallet2, wallet3, contributor2 } =
      await setupTest());
  });

  /**
   * @test Single Wallet Contributor Addition
   * @description Validates adding a contributor with a single wallet
   *
   * Scenario Verification:
   * - Contributor added with one wallet
   * - ContributorUpdated event emitted
   * - Claim info correctly reflects contributor details
   *
   * Expected Outcomes:
   * - Total allocation matches specified amount
   * - Registered wallets match input wallet
   */
  it("Should add a new contributor with single wallet", async function () {
    // Add contributor with single wallet
    const tx = await token
      .connect(owner)
      .addOrUpdateContributor(
        wallet1.address,
        "Contributor1",
        [wallet1.address],
        ALLOCATION
      );

    // Verify ContributorUpdated event
    await expect(tx)
      .to.emit(token, "ContributorUpdated")
      .withArgs("Contributor1", [wallet1.address]);

    // Retrieve and verify contributor claim information
    const claimInfo = await token.getContributorClaimInfo(wallet1.address);
    expect(claimInfo.totalAllocation).to.equal(ALLOCATION);
    expect(claimInfo.registeredWallets).to.deep.equal([wallet1.address]);
  });

  /**
   * @test Multiple Wallet Contributor Addition
   * @description Validates adding a contributor with multiple wallets
   *
   * Scenario Verification:
   * - Contributor added with multiple wallets (up to 3)
   * - ContributorUpdated event emitted
   * - Claim info correctly reflects all registered wallets
   *
   * Expected Outcomes:
   * - All specified wallets registered
   * - Event reflects all wallet addresses
   */
  it("Should add a new contributor with multiple wallets", async function () {
    // Prepare multiple wallets for contributor
    const wallets = [wallet1.address, wallet2.address, wallet3.address];

    // Add contributor with multiple wallets
    const tx = await token
      .connect(owner)
      .addOrUpdateContributor(
        wallet1.address,
        "Contributor1",
        wallets,
        ALLOCATION
      );

    // Verify ContributorUpdated event
    await expect(tx)
      .to.emit(token, "ContributorUpdated")
      .withArgs("Contributor1", wallets);

    // Retrieve and verify contributor claim information
    const claimInfo = await token.getContributorClaimInfo(wallet1.address);
    expect(claimInfo.registeredWallets).to.deep.equal(wallets);
  });

  /**
   * @test Wallet Count Limit - Exceeding Maximum
   * @description Ensures contributor cannot be added with more than 3 wallets
   *
   * Scenario Verification:
   * - Attempt to add contributor with 4 wallets
   * - Transaction should be reverted
   *
   * Expected Outcomes:
   * - Revert with "Invalid wallet count" error
   */
  it("Should reject more than 3 wallets", async function () {
    // Prepare more than 3 wallets
    const wallets = [
      wallet1.address,
      wallet2.address,
      wallet3.address,
      contributor2.address,
    ];

    // Attempt to add contributor with excess wallets
    await expect(
      token
        .connect(owner)
        .addOrUpdateContributor(
          wallet1.address,
          "Contributor1",
          wallets,
          ALLOCATION
        )
    ).to.be.revertedWith("Invalid wallet count");
  });

  /**
   * @test Wallet Count Limit - Zero Wallets
   * @description Ensures contributor cannot be added without any wallets
   *
   * Scenario Verification:
   * - Attempt to add contributor with zero wallets
   * - Transaction should be reverted
   *
   * Expected Outcomes:
   * - Revert with "Invalid wallet count" error
   */
  it("Should reject zero wallets", async function () {
    // Attempt to add contributor with no wallets
    await expect(
      token
        .connect(owner)
        .addOrUpdateContributor(wallet1.address, "Contributor1", [], ALLOCATION)
    ).to.be.revertedWith("Invalid wallet count");
  });

  /**
   * @test Update Existing Contributor Wallets
   * @description Validates updating an existing contributor's wallet addresses
   *
   * Scenario Verification:
   * - Initially add contributor with one wallet
   * - Update contributor with different wallet addresses
   * - Verify wallet addresses are updated correctly
   * - Ensure previous wallet is no longer authorized
   *
   * Expected Outcomes:
   * - ContributorUpdated event emitted with new wallets
   * - New wallets become authorized
   * - Previous wallet loses authorization
   */
  it("Should update existing contributor's wallet addresses", async function () {
    // Initial wallet setup
    const initialWallet = wallet1.address;
    const newWallets = [wallet2.address, wallet3.address];

    // Add initial contributor
    await token
      .connect(owner)
      .addOrUpdateContributor(
        initialWallet,
        "Contributor1",
        [initialWallet],
        ALLOCATION
      );

    // Verify initial wallet is authorized
    let isInitialWalletAuthorized = await token.isWalletAuthorized(
      initialWallet
    );
    expect(isInitialWalletAuthorized).to.be.true;

    // Update contributor with new wallets
    const tx = await token
      .connect(owner)
      .addOrUpdateContributor(
        initialWallet,
        "Contributor1",
        newWallets,
        ALLOCATION
      );

    // Verify ContributorUpdated event
    await expect(tx)
      .to.emit(token, "ContributorUpdated")
      .withArgs("Contributor1", newWallets);

    // Retrieve updated claim information
    const claimInfo = await token.getContributorClaimInfo(initialWallet);
    expect(claimInfo.registeredWallets).to.deep.equal(newWallets);

    // Verify wallet authorizations
    isInitialWalletAuthorized = await token.isWalletAuthorized(initialWallet);
    const isWallet2Authorized = await token.isWalletAuthorized(wallet2.address);
    const isWallet3Authorized = await token.isWalletAuthorized(wallet3.address);

    expect(isInitialWalletAuthorized).to.be.false;
    expect(isWallet2Authorized).to.be.true;
    expect(isWallet3Authorized).to.be.true;
  });
});
