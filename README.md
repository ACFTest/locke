# Locke Token (LOCKE)

An upgradeable ERC20 token contract with features such as capped supply, minting, burning, and upgradability via OpenZeppelin's proxy pattern. This repository is designed for the Locke Token project implementation. It includes test cases, deployment scripts, and functionalities for upgrading and downgrading the smart contract.

---

## Features

- **Upgradeable Contract**: Built using OpenZeppelin's upgradeable contract standards.
- **Maximum Supply**: Enforces a capped supply for token minting.
- **Minting**: Owner-only function to mint new tokens within the capped supply limit.
- **Burning**: Allows token holders (including the owner of the smart contract) to burn tokens from their balance.
- **Upgrade and Downgrade**: Demonstrates smooth contract upgrades and downgrades while maintaining state integrity.
- **Fully Tested**:  Test cases covering initialization, minting, burning, edge cases, upgrades, and downgrades.

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
git clone https://github.com/your-org/locke-token.git
cd locke-token
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
      ✔ Should allow any user to burn their own tokens
      ✔ Should not allow burning more tokens than the user owns
      ✔ Should emit a TokensBurned event on successful burning (71ms)
    Edge Cases
      ✔ Should not allow minting to the zero address
      ✔ Should not allow burning zero tokens
      ✔ Should not allow minting zero tokens
    Upgrade and Downgrade
      ✔ Should upgrade the current smart contract to TokenV2.sol and getVersion function is available (58ms)
      ✔ Should downgrade the current smart contract back to Token.sol and verify getVersion function is unavailable (80ms)
```

---

## Contact

If you have any questions, feel free to raise an issue on GitHub or contact us at [andrew.yee@mshift.com](mailto:andrew.yee@mshift.com).
