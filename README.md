# Locke Token (LOCKE)

An upgradeable ERC20 token contract with features such as capped supply, minting, burning, and upgradability via OpenZeppelin's proxy pattern. This repository is designed for the LOCKE Token project implementation. It includes test cases, deployment scripts, and functionalities for upgrading and downgrading the smart contract. This is a governance token.

---

## Features

- **Upgradeable Contract**: Built using OpenZeppelin's upgradeable contract standards.
- **Maximum Supply**: Enforces a capped supply for LOCKE token minting.
- **Minting**: Owner-only function (Smart Contract Owner) to mint new LOCKE tokens within the capped supply limit.
- **Burning**: Owner-only function (Smart Contract Owner) to burn LOCKE tokens from their balance, reducing the total supply accordingly.
- **Upgrade and Downgrade**: Demonstrates smooth contract upgrades and downgrades while maintaining state integrity.
   - **Token.sol** is the primary smart contract, intended for production, and the main focus of this project.
   - **TokenV2.sol** is a mock smart contract created exclusively for testing purposes with an additional function getVersion(). It is designed to demonstrate the upgrade and downgrade functionality of this project and is not intended for production use.
   - **Example test cases for Upgrade and Downgrade Smart Contract**
      - Upgrade from Token.sol to TokenV2.sol
      - Downgrade from TokenV2.sol to Token.sol.
- **Fully Tested**:  Test cases covering initialization, minting, burning, edge cases, upgrades, and downgrades.

---

## Deployment Parameters

**maxCapacitySupply**
1,000,000,000,000 (1 trillion) LOCKE tokens as the maximum supply allowed on the Ethereum Protocol under ERC-20 standards.

**initialSupply**
50,000,000 LOCKE tokens minted to the owner's wallet during deployment. This represents the initial circulating supply.

**maxCurrentDailySupply**
Managed in `Distribution.sol`. Calculated dynamically as the base daily supply (50,000,000 LOCKE tokens) plus the total claims from the previous day. This value is accessed by `Token.sol` to enforce minting limits.

**totalSupply**
is also the initialSupply of 50,000,000 LOCKE tokens. This is also called the current LOCKE token supply.

**deploymentTimestamp**
The timestamp recorded when the `Distribution.sol` contract is deployed. Used to calculate the current day (`dayCounter`) dynamically.

**dayCounter**
Dynamically calculated in `Distribution.sol` based on the elapsed time since `deploymentTimestamp`, adjusted for Mountain Time (MT) with predefined daylight savings rules. Used to track the number of days and account for skipped days.

**distributionContractAddress**
The address of the deployed `Distribution.sol` contract. This is required in `Token.sol` during initialization to enable interaction between the two smart contracts.

## Self Audit

1. **State Integrity**:
   - State variables maintain consistency across upgrades and downgrades.
   - Comprehensive tests for state retention.

2. **Security**:
   - Functions are restricted with access controls using `onlyOwner`.
   - NonReentrant modifiers ensure protection against reentrancy attacks.

3. **Upgradability**:
   - Built using OpenZeppelin's proxy pattern.
   - Includes reserved storage (`__gap`) to avoid storage collisions during upgrades.

4. **Tests**:
   - Test cases covers normal functionality, edge cases, and upgrade/downgrade flows.
   - Upgrade-specific functionality (e.g., `getVersion`) is tested after upgrade.

---

## Prerequisites

- **Node.js**: v16.x or above recommended.
- **Hardhat**: Installed globally or as a dev dependency.
- **Solidity Version**: 0.8.17
- **Dependencies**:
  - OpenZeppelin Contracts
  - OpenZeppelin Upgradeable Library
  - Chai.js and Ethers.js

---

## Installation

Clone the repository and install the required dependencies:

```bash

git clone https://github.com/AmericanCryptoFedDAO/locke.git
cd locke
npm install
```

---

## Deployment and Upgrade

**Note:** For testing locally use **localhost** for `<network-name>`

### 1. **Deploy the Base Contract, Token.sol**

```bash
npx hardhat run scripts/deploy.js --network <network-name>
```

This will deploy the proxy and the `Token` implementation contract.

### 2. **Upgrade to TokenV2.sol Smart Contract**

**Note:** TokenV2.sol is a mock smart contract used exclusively for testing purposes with an additional function getVersion() to demonstrate the upgrade and downgrade functionality of this project. It is not intended for production use.

```bash
npx hardhat run scripts/upgrade.js --network <network-name>
```

Upgrades the proxy to point to the `TokenV2` implementation contract. Ensures state integrity while adding `getVersion` functionality.

### 3. **Downgrade to Base Smart Contract, Token.sol**

```bash
npx hardhat run scripts/downgrade.js --network <network-name>
```

Downgrades the proxy back to the original `Token` implementation.

---

## Example Outputs

### Upgrade to TokenV2.sol Smart Contract

```
Locke Token upgraded to TokenV2 at: <eth address>
Version updated to: Version 2
```

### Downgrade to Token.sol Smart Contract

```
Locke Token downgraded to Token at: <eth address>
Version function is unavailable after downgrade
```

---

## Running Tests

Run the full test suite, including initialization, minting, burning, upgrades, and downgrades:

```bash
npx hardhat test
```

### Sample Output

```
Locke Token Contract
    Initialization
      ✔ Should set the correct owner
      ✔ Should set the correct max capacity supply
      ✔ Should set the initial supply correctly
      ✔ Should assign the initial supply to the owner
    Minting
      ✔ Should allow the owner to mint tokens
      ✔ Should not allow non-owners to mint tokens
      ✔ Should not allow minting beyond the max capacity supply
      ✔ Should emit a TokensMinted event on successful minting
    Burning
      ✔ Should allow the owner to burn tokens from their balance, reducing the total supply accordingly
      ✔ Should not allow non-owners to burn tokens
      ✔ Should emit a TokensBurned event on successful burning
    Transfers
      ✔ Should allow the owner to transfer tokens to a non-owner
      ✔ Should allow non-owners to transfer tokens to another address
      ✔ Should not allow transfers exceeding balance
    Edge Cases
      ✔ Should not allow minting to the zero address
      ✔ Should not allow burning zero tokens
      ✔ Should not allow minting zero tokens
    Upgrade and Downgrade
      ✔ Should upgrade the current smart contract to TokenV2.sol and getVersion function is available
      ✔ Should downgrade the current smart contract back to Token.sol and verify getVersion function is unavailable


  19 passing (1s)

```

---

## Contact

If you have any questions, feel free to raise an issue on GitHub or contact us at info@americancryptofed.org.
