# Token Smart Contract Documentation (Token.sol) (Human Readable)

## Key Features

### 1. Token Supply Limits

#### Units Abbreviation:
- **Trillion:** T
- **Million:** M

#### Maximum Supply:
The total supply of Locke tokens is capped at **1 Trillion tokens** or (1T), ensuring a fixed limit on the total number of tokens that can ever exist on the Ethereum Blockchain.

#### Max Daily Supply Limit:
This is the maximum daily supply amount of Locke Tokens that the smart contract **can** mint up to per day.

- **Max Daily Supply Limit = Base Supply** + **Previous Day Claims:**
  - **Base Supply:** 50 million (or 50M) Locke tokens should be available daily.
    - Note: This is not minted, just a capacity or a rule to mint that amount
  - **Previous Day Claims:** Locke tokens claimed the previous day are added to the base supply.

#### Total Daily Supply:
Current available Locke tokens on the day. Amount ranges from 0M to Max Daily Supply Limit.

  - **Initial Supply:** Initially mint the number of Locke tokens on deployment.
    - **Initial Amount:** 50 million (or 50M) Locke tokens or **Base Supply**. Upon minting, this will automatically update **Total Daily Supply**.

#### Examples:
- **Example 1:**
  - **Day 1:** Total Daily Supply = 50M tokens (Base Supply initially mint on deployment), with 40M claimed.
  - **Day 2:** Total Daily Supply = 10M left; to maintain 50M tokens, 40M tokens will be automatically minted at 12:00 AM Mountain Time.

- **Example 2:**
  - **Day 1:** Total Daily Supply = 50M tokens, with 40M claimed.
  - **Day 2:** Max Daily Supply Limit = 50M (Base Supply) + 40M (Previous Day Claims).

#### Reset Mechanism:
If fewer tokens are claimed than available in a day, the difference is not carried forward. Daily limits reset every day at 12:00 AM Mountain Time.

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
Contributors can claim tokens daily, subject to limits.

#### Partial Claims:
If the requested amount exceeds the daily limit, only the available amount is processed.

#### Example:
- **Daily limit:** 75M tokens.
- **Request:** 80M tokens.
- **Processed:** 75M tokens. Remaining 5M is unfilled and cannot be carried over.

#### Output Messages:
- **Full Claim:**
  - “Congratulations, your claim of X tokens is successful. You have Y tokens remaining.”
- **Partial Claim:**
  - “Partial claim processed: X tokens claimed. Y tokens could not be processed due to daily limits.”

---

### 4. Minting Mechanism

#### Purpose:
- **Two Ways of Minting:**
  - Ensures the **Total Supply** is maintained with **Base Supply** (50M tokens) amount:
    - The smart contract will mint up to 50M tokens (**Base Supply**), if the **Total Supply** is below the **Base Supply** at 12:00 AM Mountain Time.
  - Mint on demand if **Contributor's Claim Amount** exceed the **Total Supply** (current supply available) but stay within the **Max Daily Supply Limit**.

#### Minting Formula 1 (Maintaining 50M daily supply):
- **Minted Tokens** = **Base Supply (50M)** - **Total Daily Supply**.

#### Minting Formula 2 (Mint on demand by Contributor's Claim Amount):
- **Minted Tokens** = Difference between **Contributor's Claim Amount** and **Total Daily Supply** within **Max Daily Supply Limit**.

#### Examples:
1. **Day Start (Total Daily Supply):** 40M tokens available (already minted before).
   - **Minting Required:** 10M tokens.
   - **Result (Total Daily Supply):** 50M tokens available for claims during the day.

2. **Claiming Above Total Daily Supply:**
   - **Previous day claims:** 40M tokens.
   - **Total Daily Supply:** 40M. 
   ####
   - **Base Supply:** 50M. (Note: This is not minted, just a capacity or a rule to mint that amount)
   - **Max Daily Supply Limit:** 50M (Base Supply) + 40M (Previous Day Claims) = 90M.
   - **Total Daily Supply:** 50M.
   ####
   - **Contributor wants to claim:** 60M.
   - **Minted Tokens:** 60M (Contributor's Claim Amount) - 50M (Total Daily Supply) = 10M additional tokens.
   - **Claimed Tokens:** 60M.
   - **Total Daily Supply:** 0M.
  
3. **Claiming Above Total Daily Supply:**
   - **Previous day claims:** 60M tokens.
   - **Total Daily Supply:** 0M.
   ####  
   - **Base Supply:** 50M. (Note: This is not minted, just a capacity or a rule to mint that amount)
   - **Minted Tokens:** 50M (Base Supply) - 0M (Current available tokens) = 50M additional tokens.
   - **Total Daily Supply:** 50M.
   ####  
   - **Max Daily Supply Limit:** 50M (Base Supply) + 60M (Previous Day Claims) = 110M.
   - **Total Daily Supply:** 50M.
   ####
   - **Contributor wants to claim:** 60M.
   - **Minted Tokens:** 60M (Contributor's Claim Amount) - 50M (Total Daily Supply) = 10M additional tokens.
   - **Total Daily Supply:** 60M.
   ####  
   - **Claimed Tokens:** 60M.
   - **Total Daily Supply:** 0M.

---

### 5. Daylight Savings and Timing

#### Time Adjustments:
The contract adjusts for Mountain Time (MT) and accounts for Daylight Savings Time (DST).

#### Manual Override:
The owner can manually override DST settings if needed.

#### Next Day Calculation:
**Cutoff Time:** 11:59 PM MT.

#### Example:
- Current day ends at 11:59 PM MT.
- Next day starts at midnight MT.

---

## Additional Examples

### Maximum Daily Token Supply Limit Calculation:
- **Day 1:**
  - Base Supply = 50M.
  - No previous day claims (first day).
  - **Maximum Daily Supply Limit = 50M.**
- **Day 2:**
  - Base Supply = 50M.
  - Previous Day Claims = 15M.
  - **Maximum Daily Supply Limit = 50M + 15M = 65M.**
- **Day 3:**
  - Base Supply = 50M.
  - Previous Day Claims = 20M.
  - **Maximum Daily Supply Limit = 50M + 20M = 70M.**

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

The **Token.sol** smart contract combines advanced token minting, daily supply limits, contributor management, and streamlined claiming logic. It ensures fairness, security, and efficiency in token distribution while maintaining compliance with pre-defined limits and adjusting for mountain time with daylight savings logic.
