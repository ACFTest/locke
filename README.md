# Locke Token (LOCKE)

An upgradeable ERC20 token contract with features such as capped supply, minting, burning, and upgradability via OpenZeppelin's proxy pattern. This repository is designed for the LOCKE Token project implementation. It includes test cases, deployment scripts, and functionalities for upgrading and downgrading the smart contract.

---

## Features

- **Upgradeable Contract**: Built using OpenZeppelin's upgradeable contract standards.
- **Maximum Supply**: Enforces a capped supply for LOCKE token minting.
- **Minting**: Owner-only function (Smart Contract Owner) to mint new LOCKE tokens within the capped supply limit.
- **Burning**: Owner-only function (Smart Contract Owner) to burn LOCKE tokens from their balance, reducing the total supply accordingly.
- **Upgrade and Downgrade**: Demonstrates smooth contract upgrades and downgrades while maintaining state integrity.
- **Fully Tested**:  Test cases covering initialization, minting, burning, edge cases, upgrades, and downgrades.

---

## Deployment Parameters

- **maxCapacitySupply**: 1,000,000 LOCKE tokens as the maximum capacity
- **initialSupply**: 500,000 LOCKE tokens as the initial supply
- **totalSupply**: is also the initialSupply of 500,000 LOCKE tokens. This is also called the current LOCKE token supply.
---


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

git clone https://github.com/ACFTest/locke.git
cd locke
npm install
```

---

## Deployment and Upgrade

**Note:** For testing locally use **localhost** for `<network-name>`

### 1. **Deploy the Base Contract**

```bash
npx hardhat run scripts/deploy.js --network <network-name>
```

This will deploy the proxy and the `Token` implementation contract.

### 2. **Upgrade to TokenV2**

```bash
npx hardhat run scripts/upgrade.js --network <network-name>
```

Upgrades the proxy to point to the `TokenV2` implementation contract. Ensures state integrity while adding `getVersion` functionality.

### 3. **Downgrade to Token**

```bash
npx hardhat run scripts/downgrade.js --network <network-name>
```

Downgrades the proxy back to the original `Token` implementation.

---

## Example Outputs

### Upgrade to TokenV2

```
Locke Token upgraded to TokenV2 at: <eth address>
Version updated to: Version 2
```

### Downgrade to Token

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

If you have any questions, feel free to raise an issue on GitHub or contact us at [andrew.yee@mshift.com](mailto:andrew.yee@mshift.com).
