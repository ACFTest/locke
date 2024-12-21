# Locke Token (LOCKE)

An upgradeable ERC20 governance token for the LOCKE Token project, featuring a capped supply, minting, and OpenZeppelin-based upgradability. It implements dynamic daily claim limits for efficient token distribution and secure contributor wallet management, allowing only the contract owner to manage wallets while enabling contributors to claim and transfer tokens. The repository includes test cases, deployment scripts, and upgrade/downgrade functionality.

---

## Features

The primary focus of this repository is the implementation and functionality of the `Token.sol` contract. The contract serves as the core of the LOCKE Token governance system and includes the following features:

- **Upgradeable ERC20 Framework**: Built using OpenZeppelin's proxy pattern for seamless upgrades and downgrades.
   - **TokenV2.sol** (mock contract) demonstrates upgradeability but is not intended for production.
- **Capped Token Supply**: Total LOCKE Tokens are capped at **1 trillion tokens**, enforcing a strict supply limit.
- **Dynamic Token Claim Distribution**: Implements a mechanism to enforce daily claim limits based on prior day claims and a fixed base limit.
    - **Token Supply Limits**:
        - **Maximum Supply**: 1 Trillion LOCKE Tokens.
        - **Base Claim Limit**: 50 million LOCKE Tokens per day.
        - **Dynamic Max Daily Claim Limit**: The maximum tokens claimable in a day, recalculated daily based on prior claims.
          - **Formula**:
             ```
             Max Daily Claim Limit = Base Claim Limit (50,000,000) + Total Previous Day Claims
             ```
             This formula strictly governs the maximum number of LOCKE Tokens that can be claimed daily, ensuring fair distribution.
    
- **Contributor Wallet Management**: Ensures secure management of contributors' wallet addresses, allowing the contract owner to add, update, or remove wallets with contributor identifier (e.g., individual name and Wyoming Driver License or entity name and Wyoming entity registration number) linked to a maximum of 3 wallet eth addresses (public keys). The contract does not have access to the private keys of contributors' wallet addresses, but allows contributors to claim tokens to their selected wallets.
- **Governance Functionality**: Enables contributors to claim and transfer tokens securely and efficiently.
- **Minting:** Owner-only function to mint tokens within the capped supply limit.
- **Gas Fee Responsibility**: Contributors are responsible for gas fees when claiming or transferring tokens, promoting decentralization and sustainability.
---

## Deployment Parameters

### Token.sol
- **Token Name**: `LOCKE`
- **Token Symbol**: `LOCKE`
- **Decimals**: `18` (standard for ERC20 tokens)
- **Maximum Supply**: `1,000,000,000,000` (1 trillion) LOCKE tokens as the maximum supply allowed on the Ethereum Protocol under ERC-20 standards.
- **Owner Address**: Deployer's Ethereum wallet address
- **Proxy Admin Address**: Address managing the upgradeability of the contract
- **Upgradeable Proxy Pattern**: Deployed using OpenZeppelin's transparent proxy pattern for seamless upgrades while maintaining state integrity.

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

### 4. Example Outputs

#### Upgrade to TokenV2.sol Smart Contract

```
Locke Token upgraded to TokenV2 at: <eth address>
Version updated to: Version 2
```

#### Downgrade to Token.sol Smart Contract

```
Locke Token downgraded to Token at: <eth address>
Version function is unavailable after downgrade
```
---

## Dynamic Max Daily Claim Limit

The Max Daily Claim Limit is recalculated using the following formula:

**Max Daily Claim Limit = Base Claim Limit (50M) + Total Previous Day Claims**

### 1. Examples of Daily Claim Limit Calculations

| Day | Base Claim Limit | Previous Day Claims | Max Daily Claim Limit |
|-----|------------------|---------------------|-----------------------|
| 1   | 50M              | 0M                  | 50M                  |
| 2   | 50M              | 10M                 | 60M                  |
| 3   | 50M              | 0M                  | 50M                  |


### 2. Examples: Token Claim Distribution

The **Max Daily Claim Limit** dynamically adjusts based on the Base Claim Limit and prior day claims, ensuring fair token distribution. It includes examples of both complete and partial claims, showcasing how the system processes requests within daily limits while managing unfulfilled claims effectively.

| Day | Base Claim Limit | Total Previous Day Claims | Max Daily Claim Limit              | Total Current Day Claims | Actual Tokens Claimed | Unfilled Claims |
|-----|------------------|---------------------------|------------------------------------|--------------------------|-----------------------|-----------------|
| 1   | 50M              | 0M                        | 50M (Base Claim Limit)             | 10M                      | 10M                   | 0M              |
| 2   | 50M              | 10M                       | 50M (Base Claim Limit) + 10M = 60M | 0M                       | 0M                    | 0M              |
| 3   | 50M              | 0M                        | 50M (Base Claim Limit)             | 25M                      | 25M                   | 0M              |
| 4   | 50M              | 25M                       | 50M (Base Claim Limit) + 25M = 75M | 95M                      | 75M                   | 20M             |
| 5   | 50M              | 75M                       | 50M (Base Claim Limit) + 75M = 125M| 120M                     | 120M                  | 0M              |
| 6   | 50M              | 120M                      | 50M (Base Claim Limit) + 120M = 175M| 200M                     | 175M                  | 25M             |
| 7   | 50M              | 175M                      | 50M (Base Claim Limit) + 175M = 225M| 210M                     | 210M                  | 0M              |


---

## Contributor Management

Contributors are identified by a **unique identifier** (e.g., a Wyoming Driver License or entity registration number) and can **register up to 3 wallet addresses (public keys only)**. The allocated tokens are shared across these wallets. The contract does not have access to the private keys of contributors' wallet addresses, but allows contributors to claim tokens to their selected wallets.

### Contributor Management Features
- **Contributor data:** Unique identifier (e.g., a Wyoming Driver License or entity registration number) and up to 3 wallet eth addresses (public keys only).
- **Immutable Data For Contributors**: Contributor data cannot be updated or deleted by the contributor.
- **Flexible Updates**: The contract owner can add or update contributor data, including wallets and token allocations.

---

## Running Tests

Run the full test suite, including initialization, contributor management, daily claim scenarios, time and DST handling, upgrades, error handling, and downgrades:

```bash
npx hardhat test
```

### Sample Output

```
Token: Initialization
    ✔ Should initialize with correct values
    ✔ Should not initialize with zero address owner

  Token: Contributor Management
    ✔ Should add a new contributor with single wallet
    ✔ Should add a new contributor with multiple wallets
    ✔ Should reject more than 3 wallets
    ✔ Should reject zero wallets
    ✔ Should update existing contributor's wallet addresses

  Token: Daily Claim Scenarios

    ✔ Example 1: Base Claim Limit with 10M Claims
      - Previous Day Claims: 0
      - Max Daily Limit: 50,000,000
      - Total Request Amount: 10,000,000
      - Total Claimed: 10,000,000
      - Unfilled Claims: 0

    ✔ Example 2: Previous Day Claims with No Current Claims
      - Previous Day Claims: 10,000,000
      - Max Daily Limit: 60,000,000
      - Total Request Amount: 0
      - Total Claimed: 0
      - Unfilled Claims: 0 (44ms)

    ✔ Example 3: Base Claim Limit with 25M Claims
      - Previous Day Claims: 0
      - Max Daily Limit: 50,000,000
      - Total Request Amount: 25,000,000
      - Total Claimed: 25,000,000
      - Unfilled Claims: 0

    ✔ Example 4: Partial Claims with Increased Limit
      - Previous Day Claims: 25,000,000
      - Max Daily Limit: 75,000,000
      - Total Request Amount: 95,000,000
      - Total Claimed: 75,000,000
      - Unfilled Claims: 20,000,000 (53ms)

    ✔ Example 5: Full Claim within Increased Limit
      - Previous Day Claims: 75,000,000
      - Max Daily Limit: 125,000,000
      - Total Request Amount: 120,000,000
      - Total Claimed: 120,000,000
      - Unfilled Claims: 0 (59ms)

    ✔ Example 6: Partial Claims with High Limit
      - Previous Day Claims: 120,000,000
      - Max Daily Limit: 170,000,000
      - Total Request Amount: 200,000,000
      - Total Claimed: 170,000,000
      - Unfilled Claims: 30,000,000 (78ms)

    ✔ Example 7: Full Claim with Very High Limit
      - Previous Day Claims: 175,000,000
      - Max Daily Limit: 225,000,000
      - Total Request Amount: 210,000,000
      - Total Claimed: 210,000,000
      - Unfilled Claims: 0 (86ms)

  Token: Time and DST Handling
    ✔ Should calculate days elapsed correctly
    ✔ Should convert UTC to Mountain Time correctly
    ✔ Should maintain consistent day boundaries across DST changes
    DST Transitions
      ✔ Should handle DST start transition
      ✔ Should handle DST end transition

  Token: Error Handling
    ✔ Should prevent unauthorized wallet claims
    ✔ Should prevent claims exceeding allocation
    ✔ Should prevent claims when daily limit is exhausted
    ✔ Should reset daily limit after skipped days
    ✔ Should handle invalid claim amounts

  Token Upgrade and Downgrade Tests
    ✔ Should upgrade the current smart contract to TokenV2.sol and getVersion function is available (54ms)
    ✔ Should downgrade the current smart contract back to Token.sol and verify getVersion function is unavailable (111ms)


  26 passing (2s)

```

---

## For More In Depth Information

### Human Readable Documentation
For detailed human readable documentation and further information, please refer to the [Human Readable Documentation](docs/Human-Readable-Doc.md).

## Contact

If you have any questions, feel free to raise an issue on GitHub or contact us at info@americancryptofed.org.
