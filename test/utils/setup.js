/**
 * @file setup.js
 * @description Test environment setup utility for Token contract testing
 *
 * @overview
 * Provides a standardized setup function for initializing test environments:
 * - Generates test wallet signers
 * - Deploys token contract using UUPS proxy
 * - Establishes a clean initial timestamp
 *
 * @key_features
 * - Consistent test wallet generation
 * - Upgradeable proxy contract deployment
 * - Timestamp normalization
 *
 * @dependencies
 * - Hardhat Ethereum testing framework
 * - Hardhat Network Helpers
 * - Upgradeable proxy deployment
 *
 * @returns {Object} Initialized test environment with:
 * - token: Deployed token contract instance
 * - owner: Contract owner wallet
 * - contributor wallets
 * - general test wallets
 */
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * @function setupTest
 * @description Prepares a standardized test environment
 * @async
 * @returns {Promise<Object>} Test environment configuration
 */
async function setupTest() {
  // Generate test wallet signers
  const [
    owner,
    contributor1,
    contributor2,
    contributor3,
    wallet1,
    wallet2,
    wallet3,
  ] = await ethers.getSigners();

  // Deploy token contract using UUPS proxy
  const Token = await ethers.getContractFactory("Token");
  const token = await upgrades.deployProxy(Token, [owner.address]);
  await token.deployed();

  // Normalize initial blockchain timestamp to prevent potential timing-related test inconsistencies
  // - Retrieves the current blockchain timestamp
  // - Advances time by 1 second to create a clean, slightly offset starting point
  // - Helps avoid edge cases in time-sensitive contract operations
  const currentTime = await time.latest();
  await time.increaseTo(currentTime + 1);

  return {
    token,
    owner,
    contributor1,
    contributor2,
    contributor3,
    wallet1,
    wallet2,
    wallet3,
  };
}

module.exports = {
  setupTest,
};
