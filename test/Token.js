const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

/**
 * Locke Token Contract Test Suite
 * Includes tests for initialization, minting, burning, edge cases,
 * and upgrade/downgrade scenarios for the Locke Token contracts.
 */
describe("Locke Token Contract", function () {
  let Token,
    TokenV2,
    token,
    upgradedToken,
    downgradedToken,
    owner,
    addr1,
    addr2;

  // Constants
  const RAW_MAX_CAPACITY = "1000000"; // Max capacity in base units
  const RAW_INITIAL_SUPPLY = "500000"; // Initial supply in base units
  const DECIMALS = 18; // Token decimals
  const MAX_CAPACITY_SUPPLY = ethers.utils.parseUnits(
    RAW_MAX_CAPACITY,
    DECIMALS
  );
  const INITIAL_SUPPLY = ethers.utils.parseUnits(RAW_INITIAL_SUPPLY, DECIMALS);

  // Deploy and initialize the base Token contract before each test
  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    Token = await ethers.getContractFactory("Token");
    token = await upgrades.deployProxy(Token, [
      owner.address,
      RAW_MAX_CAPACITY,
      RAW_INITIAL_SUPPLY,
    ]);
    await token.deployed();
  });

  describe("Initialization", function () {
    it("Should set the correct owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should set the correct max capacity supply", async function () {
      expect(await token.capacitySupply()).to.equal(MAX_CAPACITY_SUPPLY);
    });

    it("Should set the initial supply correctly", async function () {
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
    });

    it("Should assign the initial supply to the owner", async function () {
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });
  });

  describe("Minting", function () {
    it("Should allow the owner to mint tokens", async function () {
      const mintAmount = ethers.utils.parseUnits("1000", DECIMALS);
      await token.mint(addr1.address, mintAmount);
      expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
      expect(await token.totalSupply()).to.equal(
        INITIAL_SUPPLY.add(mintAmount)
      );
    });

    it("Should not allow non-owners to mint tokens", async function () {
      const mintAmount = ethers.utils.parseUnits("1000", DECIMALS);
      await expect(
        token.connect(addr1).mint(addr1.address, mintAmount)
      ).to.be.revertedWith("Caller is not the owner");
    });

    it("Should not allow minting beyond the max capacity supply", async function () {
      const mintAmount = MAX_CAPACITY_SUPPLY.sub(INITIAL_SUPPLY).add(1);
      await expect(token.mint(owner.address, mintAmount)).to.be.revertedWith(
        "Minting exceeds capacity supply"
      );
    });

    it("Should emit a TokensMinted event on successful minting", async function () {
      const mintAmount = ethers.utils.parseUnits("1000", DECIMALS);
      await expect(token.mint(addr1.address, mintAmount))
        .to.emit(token, "TokensMinted")
        .withArgs(addr1.address, mintAmount);
    });
  });

  describe("Burning", function () {
    it("Should allow any user to burn their own tokens", async function () {
      const burnAmount = ethers.utils.parseUnits("1000", DECIMALS);
      await token.transfer(addr1.address, burnAmount);
      await token.connect(addr1).burn(burnAmount);
      expect(await token.balanceOf(addr1.address)).to.equal(0);
      expect(await token.totalSupply()).to.equal(
        INITIAL_SUPPLY.sub(burnAmount)
      );
    });

    it("Should not allow burning more tokens than the user owns", async function () {
      const burnAmount = ethers.utils.parseUnits("1000", DECIMALS);
      await expect(token.connect(addr1).burn(burnAmount)).to.be.revertedWith(
        "Burn amount exceeds balance"
      );
    });

    it("Should emit a TokensBurned event on successful burning", async function () {
      const burnAmount = ethers.utils.parseUnits("1000", DECIMALS);
      await token.transfer(addr1.address, burnAmount);
      await expect(token.connect(addr1).burn(burnAmount))
        .to.emit(token, "TokensBurned")
        .withArgs(addr1.address, burnAmount);
    });
  });

  describe("Edge Cases", function () {
    it("Should not allow minting to the zero address", async function () {
      const mintAmount = ethers.utils.parseUnits("1000", DECIMALS);
      await expect(
        token.mint(ethers.constants.AddressZero, mintAmount)
      ).to.be.revertedWith("Cannot mint to the zero address");
    });

    it("Should not allow burning zero tokens", async function () {
      await expect(token.burn(0)).to.be.revertedWith(
        "Burn amount must be greater than zero"
      );
    });

    it("Should not allow minting zero tokens", async function () {
      await expect(token.mint(owner.address, 0)).to.be.revertedWith(
        "Mint amount must be greater than zero"
      );
    });
  });

  describe("Upgrade and Downgrade", function () {
    beforeEach(async function () {
      TokenV2 = await ethers.getContractFactory("TokenV2");
    });

    it("Should upgrade the current smart contract to TokenV2.sol and getVersion function is available", async function () {
      // Upgrade to TokenV2.sol
      upgradedToken = await upgrades.upgradeProxy(token.address, TokenV2);

      // Verify state retention
      expect(await upgradedToken.owner()).to.equal(
        owner.address,
        "Owner should remain the same after upgrade"
      );
      expect(await upgradedToken.capacitySupply()).to.equal(
        MAX_CAPACITY_SUPPLY,
        "Max capacity should remain the same after upgrade"
      );
      expect(await upgradedToken.totalSupply()).to.equal(
        INITIAL_SUPPLY,
        "Total supply should remain the same after upgrade"
      );

      // Verify getVersion function is available
      const version = await upgradedToken.getVersion();
      expect(version).to.equal(
        "Version 2",
        "getVersion() should return 'Version 2' after upgrade"
      );

      // Test VersionUpdated event
      await expect(upgradedToken.setVersion())
        .to.emit(upgradedToken, "VersionUpdated")
        .withArgs("Version 2");
    });

    it("Should downgrade the current smart contract back to Token.sol and verify getVersion function is unavailable", async function () {
      // Upgrade to TokenV2.sol first
      upgradedToken = await upgrades.upgradeProxy(token.address, TokenV2);

      // Downgrade back to Token.sol
      downgradedToken = await upgrades.upgradeProxy(
        upgradedToken.address,
        Token
      );

      // Verify state retention
      expect(await downgradedToken.owner()).to.equal(
        owner.address,
        "Owner should remain the same after downgrade"
      );
      expect(await downgradedToken.capacitySupply()).to.equal(
        MAX_CAPACITY_SUPPLY,
        "Max capacity should remain the same after downgrade"
      );
      expect(await downgradedToken.totalSupply()).to.equal(
        INITIAL_SUPPLY,
        "Total supply should remain the same after downgrade"
      );

      // Verify getVersion function is unavailable
      try {
        await downgradedToken.getVersion();
        throw new Error("getVersion() should not exist after downgrade");
      } catch (error) {
        expect(error.message).to.include(
          "downgradedToken.getVersion is not a function",
          "getVersion() should not exist after downgrade"
        );
      }
    });
  });
});
