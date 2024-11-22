# Locke Token (LOCKE)

An upgradeable ERC20 token contract with features such as capped supply, minting, burning, and upgradability via OpenZeppelin's proxy pattern. This repository is designed for auditing and includes tests, deployment scripts, and upgrade/downgrade functionalities.

---

## Features

- **Upgradeable Contract**: Built using OpenZeppelin's upgradeable contract standards.
- **Maximum Supply**: Enforces a capped supply for token minting.
- **Minting**: Owner-only function to mint new tokens within the capped supply limit.
- **Burning**: Allows token holders to burn tokens from their balance.
- **Upgrade and Downgrade**: Demonstrates smooth contract upgrades and downgrades while maintaining state integrity.
- **Fully Tested**: Comprehensive test suite covering initialization, minting, burning, edge cases, upgrades, and downgrades.

---

## Prerequisites

- **Node.js**: v16.x or above recommended.
- **Hardhat**: Installed globally or as a dev dependency.
- **Dependencies**:
  - OpenZeppelin Contracts
  - OpenZeppelin Upgradeable Library
  - Chai.js and Ethers.js

---

## Installation

Clone the repository and install the required dependencies:

```bash
git clone https://github.com/your-org/locke-token.git
cd locke-token
npm install
```

---

## Deployment and Upgrade

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

## Running Tests

Run the full test suite, including initialization, minting, burning, upgrades, and downgrades:

```bash
npx hardhat test
```

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
   - Test suite covers normal functionality, edge cases, and upgrade/downgrade flows.
   - Upgrade-specific functionality (e.g., `getVersion`) is tested after upgrade.

---

## Example Outputs

### Upgrade to TokenV2

```
Locke Token upgraded to TokenV2 at: <address>
Version updated to: Version 2
```

### Downgrade to Token

```
Locke Token downgraded to Token at: <address>
Version function is unavailable after downgrade
```

---

## Contact and Support

If you have any questions or concerns, feel free to raise an issue on GitHub or contact us at [andrew.yee@mshift.com](mailto:andrew.yee@mshift.com).
