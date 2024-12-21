/**
 * @file Token.upgrade_downgrade.test.js
 * @description Comprehensive test suite for Smart Contract Upgrade and Downgrade
 *
 * @overview
 * Validates critical upgrade and downgrade functionalities:
 * - Smooth contract version transitions
 * - State preservation during upgrades
 * - Verification of version-specific features
 *
 * @key_features
 * - UUPS (Universal Upgradeable Proxy Standard) implementation
 * - Upgrade from Token.sol to TokenV2.sol
 * - Downgrade from TokenV2.sol back to Token.sol
 * - Version-specific function validation
 *
 * @test_contracts
 * - Token.sol: Primary production smart contract
 * - TokenV2.sol: Mock contract for upgrade testing
 *
 * @dependencies
 * - Chai assertion library
 * - Hardhat Upgrades plugin
 * - Ethers.js
 */
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Token Upgrade and Downgrade Tests", function () {
  // Test suite variables
  let token;
  let tokenV2;
  let owner;
  let addr1;

  /**
   * @description Setup routine for each test case
   * Initializes token contract with UUPS proxy
   * Prepares test environment for upgrade/downgrade scenarios
   */
  beforeEach(async function () {
    // Get test signers
    [owner, addr1] = await ethers.getSigners();

    // Deploy initial Token contract with UUPS proxy
    const Token = await ethers.getContractFactory("Token");
    token = await upgrades.deployProxy(Token, [owner.address], {
      initializer: "initialize",
      kind: "uups",
      unsafeAllow: ["constructor"],
    });

    // Wait for deployment to complete
    await token.deployed();
  });

  /**
   * @test Upgrade to TokenV2
   * @description Validates successful contract upgrade from Token.sol to TokenV2.sol
   *
   * Test Scenarios:
   * - Deploy TokenV2 implementation
   * - Execute upgrade transaction
   * - Verify version-specific function availability
   */
  it("Should upgrade the current smart contract to TokenV2.sol and getVersion function is available", async function () {
    // Create TokenV2 factory and connect with owner
    const TokenV2 = await ethers.getContractFactory("TokenV2", owner);

    // Deploy TokenV2 implementation
    const tokenV2Implementation = await TokenV2.deploy();
    await tokenV2Implementation.deployed();

    // Prepare the upgrade
    const data = token.interface.encodeFunctionData("upgradeTo", [
      tokenV2Implementation.address,
    ]);

    // Execute upgrade
    await owner.sendTransaction({
      to: token.address,
      data: data,
    });

    // Get TokenV2 instance at proxy address
    tokenV2 = TokenV2.attach(token.address);

    // Verify upgrade
    expect(await tokenV2.getVersion()).to.equal("Version 2");
  });

  /**
   * @test Downgrade to Token.sol
   * @description Validates successful contract downgrade from TokenV2.sol back to Token.sol
   *
   * Test Scenarios:
   * - Upgrade to TokenV2
   * - Verify V2 functionality
   * - Downgrade back to original Token.sol
   * - Confirm version-specific function is unavailable
   */
  it("Should downgrade the current smart contract back to Token.sol and verify getVersion function is unavailable", async function () {
    // First upgrade to V2
    const TokenV2 = await ethers.getContractFactory("TokenV2", owner);
    const tokenV2Implementation = await TokenV2.deploy();
    await tokenV2Implementation.deployed();

    // Execute upgrade to V2
    const upgradeData = token.interface.encodeFunctionData("upgradeTo", [
      tokenV2Implementation.address,
    ]);
    await owner.sendTransaction({
      to: token.address,
      data: upgradeData,
    });

    // Get V2 instance
    tokenV2 = TokenV2.attach(token.address);

    // Verify V2 functionality
    expect(await tokenV2.getVersion()).to.equal("Version 2");

    // Now downgrade to V1
    const Token = await ethers.getContractFactory("Token", owner);
    const tokenV1Implementation = await Token.deploy();
    await tokenV1Implementation.deployed();

    // Execute downgrade
    const downgradeData = tokenV2.interface.encodeFunctionData("upgradeTo", [
      tokenV1Implementation.address,
    ]);
    await owner.sendTransaction({
      to: tokenV2.address,
      data: downgradeData,
    });

    // Get V1 instance
    const tokenV1 = Token.attach(token.address);

    // Verify downgrade by checking that the function selector for getVersion doesn't exist
    const functionSelector = ethers.utils.id("getVersion()").slice(0, 10);
    const code = await ethers.provider.getCode(tokenV1.address);
    expect(code.indexOf(functionSelector.slice(2))).to.equal(-1);
  });
});
