# Locke Token (LOCKE) (Token.sol)

An upgradeable ERC20 governance token for the LOCKE Token project, featuring a capped supply, minting, and OpenZeppelin-based upgradability. It implements dynamic daily claim limits for efficient token distribution and secure contributor wallet management, allowing only the contract owner to manage wallets while enabling contributors to claim and transfer tokens. The repository includes test cases, deployment scripts, and upgrade/downgrade functionality.

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
## Documentation Units Abbreviation Only:
- **Trillion:** T
- **Million:** M
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

---

## Variables and Functions

### 1. State Variables

#### Constants:
- **`MAX_SUPPLY`**: Maximum token supply (1 trillion tokens).
- **`DAILY_BASE_SUPPLY`**: Daily base token supply capacity (50 million tokens).
- **`SECONDS_IN_A_DAY`**: Number of seconds in one day (86,400).

#### State Variables:
- **`_lastProcessedTime`**: Timestamp of the last claim processed.
- **`_dailyMintedAmount`**: Tokens minted for the current day.
- **`_previousDayClaim`**: Total tokens claimed on the previous day.
- **`_maxDailyLimit`**: Maximum tokens that can be claimed for the current day.
- **`_contributors`**: Mapping of contributor addresses to their respective data (`identifier`, `wallets`, `allocatedTokens`, `claimedTokens`).
- **`_authorizedWallets`**: Mapping to quickly check if a wallet is authorized for claiming.
- **`_isManualOverride`**: Boolean to enable or disable manual daylight savings override.
- **`_isDaylightSavingsActive`**: Boolean to indicate if daylight savings time (DST) is currently active.
- **`_dstStartTimestamp`**: Timestamp when DST starts for the current year.
- **`_dstEndTimestamp`**: Timestamp when DST ends for the current year.

### 2. Functions

#### **Initialization**
- **`initialize(address initialOwner)`**:  
  Initializes the contract, sets the owner, and establishes initial state variables and daylight savings configurations.

#### **Upgrade**
- **`_authorizeUpgrade(address newImplementation)`**:  
  Authorizes the upgrade to a new implementation of the smart contract.

#### **Contributor Management**
- **`addOrUpdateContributor(address contributorAddress, string memory identifier, address[] memory wallets, uint256 allocatedTokens)`**:  
  Adds or updates contributor details, including authorized wallets and token allocation.
  
- **`getContributor(address contributorAddress)`**:  
  Fetches contributor details such as the identifier, authorized wallets, allocated tokens, and claimed tokens.

#### **Claim Processing**
- **`claimTokens(uint256 amount)`**:  
  Allows contributors to claim tokens, enforces daily claim limits, updates state variables, and mints the requested tokens (if possible).
  
- **`_calculateDailyLimit()`**:  
  Private function that calculates the maximum daily claimable tokens based on the base supply and previous day claims.
  
- **`_updateDailyLimit()`**:  
  Private function to update the daily limit at the start of a new day.

#### **View Functions**
- **`getDailyMintedAmount()`**:  
  Returns the total tokens minted today.
  
- **`getPreviousDayClaim()`**:  
  Returns the total tokens claimed on the previous day.
  
- **`getCurrentMaxDailyLimit()`**:  
  Returns the current maximum daily claimable limit.
  
- **`isWalletAuthorized(address wallet)`**:  
  Checks if a specific wallet is authorized for claims.
  
- **`getDSTStatus()`**:  
  Retrieves the daylight savings time (DST) configuration, including manual override and active status.

- **`getContributorClaimInfo(address contributorAddress)`**:  
  Provides real-time claim information for a contributor, including daily limits, available claims, and wallet-specific details.

#### **Utility Functions**
- **`daysElapsed(uint256 lastClaimTimestamp)`**:  
  Calculates the number of full days elapsed since the last claim in Mountain Time.

- **`toMountainTime(uint256 timestamp)`**:  
  Converts a UTC timestamp to Mountain Time, adjusting for daylight savings if applicable.

- **`_getCurrentUTCOffset()`**:  
  Private function to calculate the current UTC offset for Mountain Time, taking into account daylight savings.

- **`_updateDaylightSavings()`**:  
  Updates the start and end timestamps for daylight savings time for the current year.

- **`_calculateDSTStart(uint256 timestamp)`**:  
  Calculates the start timestamp of daylight savings for the current year.

- **`_calculateDSTEnd(uint256 timestamp)`**:  
  Calculates the end timestamp of daylight savings for the current year.

- **`setManualDSTOverride(bool isManualOverride, bool _isDaylightSavingsActive)`**:  
  Allows the owner of the contract to manually override the daylight savings settings.  
  - **Parameters**:
    - `isManualOverride`:  
      `true` to activate manual override; `false` to revert to automatic DST handling.  
    - `_isDaylightSavingsActive`:  
      `true` to set DST as active (UTC offset of -6 hours); `false` to set DST as inactive (UTC offset of -7 hours).  

- **`_uintToString(uint256 value)`**:  
  Converts a `uint256` value to its string representation.

---

## Contributor Claim Information (`getContributorClaimInfo` function)

The `getContributorClaimInfo` function provides real-time details regarding a contributor's token allocation, system-wide claim status, and specific wallet claim progress. It enables contributors to access a comprehensive breakdown of their claimable tokens and the current state of the token distribution system.

### 1. Function Overview

#### Purpose:
This function retrieves detailed claim information for a specific contributor. It outputs relevant details such as daily limits, remaining system-wide claim availability, and per-wallet token claims.

##### Data Retrieved by `getContributorClaimInfo`

A. **Max Daily Claim Limit**:
   - The maximum number of tokens available for all contributors to claim in a single day.
   - Derived from:
     ```solidity
     maxDailyClaimLimit = DAILY_BASE_SUPPLY + _previousDayClaim;
     ```
   - **Example Output**:
     ```
     Max Daily Claim Limit: 100,000,000 tokens
     ```

B. **Total Remaining Day Claim**:
   - The total number of tokens still available for claims system-wide on the current day.
   - Calculated as:
     ```solidity
     totalRemainingDayClaim = maxDailyClaimLimit > _dailyMintedAmount ? maxDailyClaimLimit - _dailyMintedAmount : 0;
     ```
   - **Example Output**:
     ```
     Total Remaining Day Claim: 10,000,000 tokens
     ```

C. **Wallet-Specific Claim Details**:
   - Lists the contributor's registered wallet addresses and the total tokens claimed per wallet.
   - **Example Output**:
     ```
     Registered Wallets: 3
     Tokens Claimed:
     Wallet 1 (0x1234...abcd): 5,000,000 tokens
     Wallet 2 (0x5678...efgh): 3,000,000 tokens
     Wallet 3 (0x9abc...ijkl): 2,000,000 tokens
     ```

D. **Total Claim Allocation**:
   - The total number of tokens allocated to the contributor.
   - Fetched directly from:
     ```solidity
     totalAllocation = contributor.allocatedTokens;
     ```
   - **Example Output**:
     ```
     Total Claim Allocation: 25,000,000 tokens
     ```

E. **Unclaimed Allocation**:
   - The remaining unclaimed tokens from the contributor's allocation.
   - Calculated as:
     ```solidity
     unclaimedAllocation = contributor.allocatedTokens - contributor.claimedTokens;
     ```
   - **Example Output**:
     ```
     Unclaimed Allocation: 15,000,000 tokens
     ```

F. **Current Estimated Available Allocated Claim**:
   - The maximum tokens the contributor can claim at the time of the call. It is the lesser of the unclaimed allocation and the system-wide remaining tokens.
   - Computed as:
     ```solidity
     estimatedAvailableClaim = totalRemainingDayClaim < unclaimedAllocation ? totalRemainingDayClaim : unclaimedAllocation;
     ```
   - **Example Output**:
     ```
     Current Estimated Available Allocated Claim: 10,000,000 tokens
     ```

### 2. Function Input Requirements

- **Contributor Address**: The Ethereum address of the contributor for whom claim information is being retrieved.

##### Example: Contributor Claim Query

##### Scenario:
Contributor calls `getContributorClaimInfo` with their primary wallet address.

##### Example Code:
```solidity
(address contributorAddress)
    external 
    view 
    returns (
        uint256 maxDailyClaimLimit,
        uint256 totalRemainingDayClaim,
        address[] memory registeredWallets,
        uint256[] memory tokensClaimedPerWallet,
        uint256 totalAllocation,
        uint256 unclaimedAllocation,
        uint256 estimatedAvailableClaim
    )
```

##### Sample Output:
```
System-Wide Information:
Max Daily Claim Limit: 100M tokens
Total Remaining Day Claim: 10M tokens

Contributor Information:
Registered Wallets: 3
Tokens Claimed:
Wallet 1 (0x1234...abcd): 5,000,000 tokens
Wallet 2 (0x5678...efgh): 3,000,000 tokens
Wallet 3 (0x9abc...ijkl): 2,000,000 tokens

Total Claim Allocation: 25M tokens
Unclaimed Allocation: 15M tokens
Current Estimated Available Allocated Claim: 10,000,000 tokens
```

### 3. Key Notes:

A. **Dynamic Updates**:
   - The `Current Estimated Available Allocated Claim` is recalculated in real-time, ensuring contributors receive up-to-date information on their claimable tokens.

B. **Non-Reservation**:
   - Calling this function **does not reserve tokens** for the contributor. The values reflect the system state at the time of the call and are subject to change.

C. **Input Validation**:
   - The function requires valid input, specifically a registered contributor address. If the contributor is not registered, the system throws an error.

By leveraging the `getContributorClaimInfo` function, contributors can manage their token claims effectively while gaining insight into the system's overall claim status.

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
## Daylight Savings and Timing

### `daysElapsed` Formula and Calculation

The `daysElapsed` function calculates the number of full days that have passed between two timestamps, adjusting for Mountain Time (MT) with Daylight Saving Time (DST) considerations. This function is used to manage time-based state transitions for token claims.

#### Formula:

```solidity
daysElapsed = (currentMountainTime / SECONDS_IN_A_DAY) - 
              (lastClaimMountainTime / SECONDS_IN_A_DAY);
```

- **`SECONDS_IN_A_DAY`**: Represents the total number of seconds in one day (86,400 seconds).
- **`currentMountainTime`**: The current timestamp, converted from UTC to Mountain Time.
- **`lastClaimMountainTime`**: The timestamp of the last claim, converted from UTC to Mountain Time.

This formula divides the timestamps by the seconds in a day to calculate the day component, then subtracts the results to determine the number of full days elapsed.

#### Implementation:

The `daysElapsed` function is defined as follows in `Token.sol`:

```solidity
function daysElapsed(uint256 lastClaimTimestamp) public view returns (uint256) {
    uint256 currentMountainTime = toMountainTime(block.timestamp);
    uint256 lastClaimMountainTime = toMountainTime(lastClaimTimestamp);
    return (currentMountainTime / SECONDS_IN_A_DAY) - 
           (lastClaimMountainTime / SECONDS_IN_A_DAY);
}
```

- **`toMountainTime(uint256 timestamp)`**: Converts a given UTC timestamp into Mountain Time, factoring in DST if applicable.
- The result is a non-negative integer representing the number of full days elapsed.

#### Example Scenarios:

| Current UTC Time   | Last Claim UTC Time | Mountain Time Conversion | `daysElapsed` Output |
|---------------------|---------------------|--------------------------|-----------------------|
| 2024-11-05 00:00   | 2024-11-04 00:00    | -7 hours (Standard Time) | 1 day                |
| 2024-03-12 00:00   | 2024-03-11 12:00    | -6 hours (DST Active)    | 0 days               |
| 2024-12-01 18:00   | 2024-11-29 18:00    | -7 hours (Standard Time) | 2 days               |

#### DST Considerations:

- The `toMountainTime` function ensures that the Mountain Time conversion accounts for whether DST is active. The function adjusts the UTC offset to either -6 or -7 hours accordingly.

#### Utility:

The `daysElapsed` calculation plays a vital role in ensuring that claim limits are reset accurately during day transitions and skipped days, maintaining consistent functionality of the daily claim system.

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
      - Unfilled Claims: 0 (42ms)

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
      - Unfilled Claims: 20,000,000 (56ms)

    ✔ Example 5: Full Claim within Increased Limit
      - Previous Day Claims: 75,000,000
      - Max Daily Limit: 125,000,000
      - Total Request Amount: 120,000,000
      - Total Claimed: 120,000,000
      - Unfilled Claims: 0 (65ms)

    ✔ Example 6: Partial Claims with High Limit
      - Previous Day Claims: 120,000,000
      - Max Daily Limit: 170,000,000
      - Total Request Amount: 200,000,000
      - Total Claimed: 170,000,000
      - Unfilled Claims: 30,000,000 (85ms)

    ✔ Example 7: Full Claim with Very High Limit
      - Previous Day Claims: 175,000,000
      - Max Daily Limit: 225,000,000
      - Total Request Amount: 210,000,000
      - Total Claimed: 210,000,000
      - Unfilled Claims: 0 (102ms)

  Token: Time and DST Handling
    ✔ Should calculate days elapsed correctly
    ✔ Should convert UTC to Mountain Time correctly
    ✔ Should maintain consistent day boundaries across DST changes
    DST Transitions
      ✔ Should handle DST start transition
      ✔ Should handle DST end transition
    Manual DST Override
      ✔ Should activate manual override and set DST active
      ✔ Should activate manual override and set DST inactive
      ✔ Should disable manual override and revert to automatic DST

  Token: Error Handling
    ✔ Should prevent unauthorized wallet claims
    ✔ Should prevent claims exceeding allocation
    ✔ Should prevent claims when daily limit is exhausted
    ✔ Should reset daily limit after skipped days
    ✔ Should handle invalid claim amounts

  Token Upgrade and Downgrade Tests
    ✔ Should upgrade the current smart contract to TokenV2.sol and getVersion function is available (54ms)
    ✔ Should downgrade the current smart contract back to Token.sol and verify getVersion function is unavailable (110ms)


  29 passing (2s)

```

---

## For More In Depth Information

### Human Readable Documentation
For detailed human readable documentation and further information, please refer to the [Human Readable Documentation](docs/Human-Readable-Doc.md).

## Contact

If you have any questions, feel free to raise an issue on GitHub or contact us at info@americancryptofed.org.
