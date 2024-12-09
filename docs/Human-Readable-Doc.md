# Token Smart Contract Documentation (Token.sol)

## Key Features

### 1. Token Supply Limits

#### Units Abbreviation:
- **Trillion:** T
- **Million:** M

#### Maximum Supply:
The total supply of Locke tokens is capped at **1 Trillion tokens** or (1T), ensuring a fixed limit on the total number of tokens that can ever exist on the Ethereum Blockchain.

#### Max Daily Claim Limit:
The **Max Daily Claim Limit** determines the maximum number of Locke Tokens that contributors can claim in a single day. This value is recalculated dynamically based on the **Base Claim Limit** and the **Total Previous Day Claims.**

- **Formula:**
  - **Max Daily Claim Limit = Base Claim Limit (50M)** + **Total Previous Day Claims**
- **Base Claim Limit:** 50 million (50M) Locke tokens are available as a fixed capacity per day.
- **Total Previous Day Claims:** The actual number of tokens claimed during the previous day.

#### Examples:
- **Example 1:**
  - **Day 1:** Contributor claims 10M tokens.
    - **Total Previous Day Claims:** 10M.
    - **Max Daily Claim Limit (Day 2):** 50M (Base Claim Limit) + 10M = 60M.

- **Example 2:**
  - **Day 2:** Contributor claims 0M tokens.
    - **Total Previous Day Claims:** 0M.
    - **Max Daily Claim Limit (Day 3):** 50M (Base Claim Limit) + 0M = 50M.

- **Example 3:**
  - **Day 3:** Contributor claims 25M tokens.
    - **Total Previous Day Claims:** 25M.
    - **Max Daily Claim Limit (Day 4):** 50M (Base Claim Limit) + 25M = 75M.

---

### 2. Contributor Management (Contributor's Identifier Account)

#### Identification:
Contributors are identified by an identifier (e.g., name, registration number) linked to a maximum of 3 wallet eth addresses.

#### Immutable Data for Contributors Only:
- Contributors cannot update or delete their identifiers or wallets to prevent fraud.
- Owner of the smart contract (CryptoFed) can add, update **Contributor's Identifier Account** including 1-3 wallet eth addresses.
  - **Contributor's Identifier Account** must have at least 1 wallet eth address for the account to be established or added.

#### Token Allocation:
Tokens allocated to a contributor are shared across their registered wallets.

#### Example:
- Contributor has 3 wallets and is allocated 30 tokens.
  - Wallet #1 claims 7 tokens. Remaining balance: 23 tokens.
  - Wallet #2 claims 8 tokens. Remaining balance: 15 tokens.
  - Wallet #3 claims 6 tokens. Remaining balance: 9 tokens.

---

### 3. Claiming Tokens

#### Claim Limits:
Contributors can claim tokens dynamically, subject to the current calculated **Max Daily Claim Limit.**

#### Partial Claims:
If the requested amount exceeds the calculated daily limit, only the available amount is processed.

#### Example:
- **Max Daily Claim Limit:** 80M tokens.
- **Request:** 90M tokens.
- **Processed:** 80M tokens. Remaining 10M is unfilled and cannot be carried over.

#### Output Messages:
- **Full Claim:**
  - “Congratulations, your claim of X tokens is successful. You have Y tokens remaining.”
- **Partial Claim:**
  - “Partial claim processed: X tokens claimed. Y tokens could not be processed due to daily limits.”

---

### 4. Minting Mechanism

#### Purpose:
- Tokens are minted directly to contributors’ selected Ethereum wallet addresses on demand.
- The minting process ensures that tokens are created only when contributors claim them, complying with the **Max Daily Claim Limit**.
- **Total Token Supply:**
  - Tracks the total number of tokens minted so far.
  - **Purpose:**
    1. **ERC-20 Compliance:** The `totalSupply()` function is required by the ERC-20 standard, providing transparency about the total number of tokens in circulation.
    2. **Max Supply Enforcement:** Ensures the total tokens minted never exceed the defined maximum limit (e.g., 1 trillion tokens).
    
#### Dynamic Calculation of Total Previous Day Claims:
- The **`daysElapsed`** value determines whether the **Total Previous Day Claims** should be carried forward or reset to `0` based on the time elapsed since the last claim or mint.

- **Formula to Determine Days Elapsed:**
  - **daysElapsed = (Current Time - Last Claim Time) / 1 Day**

- **Status Labels for `daysElapsed`:**
  - **`daysElapsed == 0 (status: Same Day)`**: The current day is the same as the last claim day, so the **Total Previous Day Claims** stay unchanged.
  - **`daysElapsed == 1 (status: Consecutive Day)`**: The current day is directly after the last claim day; the **Total Previous Day Claims** remain valid.
  - **`daysElapsed > 1 (status: Skipped Days)`**: Skipped days occurred; the **Total Previous Day Claims** are reset to `0` because no claims occurred during those days.

#### Examples:

##### Example 1: Same Day
- **Day 1 Claims:** 40M tokens in the morning.
- **Day 1 Claims (Afternoon):** Contributor claims another 20M tokens.
  - **daysElapsed = 0 (status: Same Day)**.
  - **Total Previous Day Claims = 0 (as no claims occurred on Day 0)**.
  - **Max Daily Claim Limit:** 50M (Base Claim Limit) + 0 (Total Previous Day Claims) = 50M.

##### Example 2: Consecutive Day
- **Day 1 Claims:** 30M tokens.
- **Day 2 Claims:** 15M tokens.
  - **daysElapsed = 1 (status: Consecutive Day)**.
  - **Total Previous Day Claims = 30M (from Day 1)**.
  - **Max Daily Claim Limit:** 50M (Base Claim Limit) + 30M (Total Previous Day Claims) = 80M.

##### Example 3: Skipped Days
- **Day 1 Claims:** 25M tokens.
- **Day 2-4:** No claims.
- **Day 5 Claims:** 20M tokens.
  - **daysElapsed = 4 (status: Skipped Days)**.
  - **Total Previous Day Claims = 0 (reset due to skipped Days 2-4)**.
  - **Max Daily Claim Limit:** 50M (Base Claim Limit) + 0 (Total Previous Day Claims) = 50M.

---

### 5. Daylight Savings and Timing

Ethereum uses **UTC timestamps** by default because it is a global standard and simplifies blockchain operations. Mountain Time (MT) tracking, including **Daylight Savings Time (DST)** adjustments, is implemented by converting UTC to MT.

#### **How to Convert UTC to Mountain Time**

Mountain Time operates on two offsets:
- **Standard Time:** UTC-7
- **DST (Summer):** UTC-6

To convert:
1. If DST is active, subtract **6 hours** from UTC.
2. If not, subtract **7 hours**.
3. The contract includes a **manual override** for DST settings, allowing adjustments to account for changes or unexpected transitions.

#### **Calculating `daysElapsed`**

`daysElapsed` measures full days between two timestamps based on Mountain Time:

##### **Formula**:
```
daysElapsed = (toMountainTime(currentTimestamp) / 1 day) - (toMountainTime(lastClaimTimestamp) / 1 day)
```

##### **Steps**:
1. Convert UTC timestamps to MT.
2. Divide each by 1 day (86400 seconds).
3. Subtract to get the difference.

##### **Example**
- **Last Total Previous Claim Timestamp:** November 2, 2024, 11:00 PM UTC → November 2, 2024, 5:00 PM MDT (Mountain Daylight Time).
- **Current Claim Timestamp:** November 4, 2024, 2:00 AM UTC → November 3, 2024, 7:00 PM MST (Mountain Standard Time).
- **Result:** `daysElapsed = 2`.
- **Total Previous Day Claims = 0 (reset due to 1 skipped Day)**.
- **Max Daily Claim Limit:** 50M (Base Claim Limit) + 0 (Total Previous Day Claims) = 50M.

#### **Key Points**
- **Mountain Time Conversion:** Adjusts UTC to local time (-7 or -6 hours).
- **`daysElapsed` Calculation:** Ensures accurate tracking of daily operations based on Mountain Time.

---

## Additional Examples

### Max Daily Claim Limit Calculation:
- **Day 1:**
  - Base Claim Limit = 50M.
  - No previous day claims (first day).
  - **Max Daily Claim Limit = 50M.**
- **Day 2:**
  - Base Claim Limit = 50M.
  - Total Previous Day Claims = 15M.
  - **Max Daily Claim Limit = 50M + 15M = 65M.**
- **Day 3:**
  - Base Claim Limit = 50M.
  - Total Previous Day Claims = 20M.
  - **Max Daily Claim Limit = 50M + 20M = 70M.**

### Token Claim by Contributor:
- **Contributor Allocation:** 30 tokens across 3 wallets.
  - Wallet #1 claims 7 tokens.
    - **Remaining Allocation:** 23 tokens.
  - Wallet #2 claims 8 tokens.
    - **Remaining Allocation:** 15 tokens.
  - Wallet #3 claims 6 tokens.
    - **Remaining Allocation:** 9 tokens.

---

## Error Messages

- **Unauthorized Wallet:**
  - “Unauthorized wallet.”
- **Exceeds Allocation:**
  - “Exceeds allocation.”
- **No Tokens Available Today:**
  - “No tokens available today.”
- **Partial Claim:**
  - “Partial claim processed: X tokens claimed. Y tokens could not be processed due to daily limits.”
- **Successful Claim:**
  - “Congratulations, your claim of X tokens is successful. You have Y tokens remaining.”

---

## Summary

The **Token.sol** smart contract combines advanced token minting, dynamic claim limit calculations, contributor management, and streamlined claiming logic. Tokens are minted only on demand when contributors claim them, and the contract dynamically calculates the **Max Daily Claim Limit** based on the **Base Claim Limit** and the **Total Previous Day Claims.**
