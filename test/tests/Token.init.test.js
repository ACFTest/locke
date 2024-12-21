/**
 * @file Token.init.test.js
 * @description Initialization test suite for Token contract
 *
 * @overview
 * Validates critical initialization requirements:
 * - Correct token metadata (name, symbol)
 * - Ownership assignment
 * - Initial supply check
 * - Prevention of zero address ownership
 *
 * @key_features
 * - Token name and symbol verification
 * - Owner address validation
 * - Initial supply validation
 * - Zero address ownership prevention
 *
 * @dependencies
 * - Chai assertion library
 * - Hardhat Ethereum testing framework
 * - Upgradeable proxy deployment
 */
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { setupTest } = require("../utils/setup");

describe("Token: Initialization", function () {
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
   * @test Token Metadata Verification
   * @description Validates initial token configuration
   *
   * Test Scenarios:
   * - Verify token name is "Locke Token"
   * - Verify token symbol is "LOCKE"
   * - Confirm owner address is correctly set
   * - Check initial total supply is zero
   */
  it("Should initialize with correct values", async function () {
    expect(await token.name()).to.equal("Locke Token");
    expect(await token.symbol()).to.equal("LOCKE");
    expect(await token.owner()).to.equal(owner.address);
    expect(await token.totalSupply()).to.equal(0);
  });

  /**
   * @test Zero Address Ownership Prevention
   * @description Ensures contract cannot be initialized with zero address owner
   *
   * Test Scenarios:
   * - Attempt to deploy proxy with zero address
   * - Verify deployment is rejected
   * - Confirm error message matches expected
   */
  it("Should not initialize with zero address owner", async function () {
    const Token = await ethers.getContractFactory("Token");
    await expect(
      upgrades.deployProxy(Token, [ethers.constants.AddressZero])
    ).to.be.revertedWith("Owner cannot be zero address");
  });
});
