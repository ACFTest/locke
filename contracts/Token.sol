// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title Token Contract
 * @notice ERC20 token with dynamic daily claim limits
 * @dev Implements daily token distribution with contributor management
 *      Enforces claim limits and handles time-based state transitions
 */

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract Token is 
    Initializable, 
    ERC20Upgradeable, 
    ReentrancyGuardUpgradeable, 
    OwnableUpgradeable, 
    UUPSUpgradeable 
{
    // ======== Constants ========

    /// @dev Maximum token supply (1T tokens)
    uint256 private constant MAX_SUPPLY = 1_000_000_000_000 ether;

    /// @dev Base daily claim capacity (50M tokens)
    uint256 private constant DAILY_BASE_SUPPLY = 50_000_000 ether;

    /// @dev Seconds in one day for time calculations
    uint256 private constant SECONDS_IN_A_DAY = 86400;

    // ======== State Variables ========

    /// @dev Last claim processing timestamp
    uint256 private _lastProcessedTime;

    /// @dev Current day's minted token total
    uint256 private _dailyMintedAmount;

    /// @dev Previous day's total claimed tokens
    uint256 private _previousDayClaim;

    /// @dev Current day's maximum claim limit
    uint256 private _maxDailyLimit;

    /**
     * @dev Contributor information structure
     * @param identifier WY Driver License or entity registration
     * @param wallets 1-3 authorized wallet addresses
     * @param allocatedTokens Total token allocation
     * @param claimedTokens Total claimed across all wallets
     */
    struct Contributor {
        string identifier;
        address[] wallets;
        uint256 allocatedTokens;
        uint256 claimedTokens;
    }

    /// @dev Maps contributor addresses to their data
    mapping(address => Contributor) private _contributors;

    /// @dev Quick lookup for authorized wallets
    mapping(address => bool) private _authorizedWallets;

    /// @dev DST management variables
    bool private _manualOverride;
    bool private _daylightSavingsActive;
    uint256 private _dstStartTimestamp;
    uint256 private _dstEndTimestamp;

    // ======== Events ========

    /**
     * @dev Emitted when tokens are minted
     * @param to Recipient address
     * @param amount Token amount
     */
    event TokensMinted(address indexed to, uint256 amount);

    /**
     * @dev Emitted when tokens are claimed
     * @param wallet Claiming wallet
     * @param amount Token amount
     */
    event TokensClaimed(address indexed wallet, uint256 amount);

    /**
     * @dev Emitted when contributor data changes
     * @param identifier Contributor ID
     * @param wallets Updated wallet list
     */
    event ContributorUpdated(string identifier, address[] wallets);

    /**
     * @dev Emitted when DST settings change
     * @param overrideActive Manual override status
     * @param daylightSavingsActive DST status
     */
    event ManualOverrideUpdated(bool overrideActive, bool daylightSavingsActive);

    /**
     * @dev Emitted with claim status
     * @param wallet Claiming wallet
     * @param message Status details
     */
    event ClaimStatus(address indexed wallet, string message);

    /**
     * @dev Emitted when daily limit updates
     * @param newLimit Updated daily limit
     * @param previousDayClaim Previous day total
     */
    event DailyLimitUpdated(uint256 newLimit, uint256 previousDayClaim);

    /**
     * @dev Debug event for claim processing steps
     * @param step Current processing step
     * @param requestedAmount Amount requested in claim
     * @param currentLimit Current daily limit
     * @param dailyMinted Total minted today
     * @param remainingSupply Remaining available supply
     * @param actualClaimAmount Final amount claimed
     */
    event DebugClaimProcess(
        string step,
        uint256 requestedAmount,
        uint256 currentLimit,
        uint256 dailyMinted,
        uint256 remainingSupply,
        uint256 actualClaimAmount
    );

    // ======== Initialization and Core Functions ========

    /**
     * @notice Initializes the token contract
     * @param initialOwner Address of contract owner
     * @dev Sets initial state:
     *      - Initializes ERC20 with name and symbol
     *      - Sets up security features
     *      - Configures initial time values
     *      - Sets base daily limit
     */
    function initialize(address initialOwner) public initializer {
        require(initialOwner != address(0), "Owner cannot be zero address");

        __ERC20_init("Locke Token", "LOCKE");
        __ReentrancyGuard_init();
        __Ownable_init();
        __UUPSUpgradeable_init();

        transferOwnership(initialOwner);

        _lastProcessedTime = block.timestamp;
        _dailyMintedAmount = 0;
        _previousDayClaim = 0;
        _maxDailyLimit = DAILY_BASE_SUPPLY;

        _updateDaylightSavings();
    }

    /**
     * @notice Authorizes contract upgrades
     * @param newImplementation Address of new implementation
     * @dev UUPS upgrade authorization
     */
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyOwner 
    {}

    /**
     * @notice Adds or updates contributor information
     * @param contributorAddress Primary address for contributor
     * @param identifier Unique WY identifier
     * @param wallets Array of authorized wallets (1-3)
     * @param allocatedTokens Total token allocation
     * @dev Updates all contributor data atomically:
     *      - Sets identifier and allocation
     *      - Updates wallet authorizations
     *      - Emits update event
     */
    function addOrUpdateContributor(
        address contributorAddress,
        string memory identifier,
        address[] memory wallets,
        uint256 allocatedTokens
    ) external onlyOwner {
        require(wallets.length > 0 && wallets.length <= 3, "Invalid wallet count");

        Contributor storage contributor = _contributors[contributorAddress];
        contributor.identifier = identifier;

        // Remove old authorizations
        for (uint256 i = 0; i < contributor.wallets.length; i++) {
            _authorizedWallets[contributor.wallets[i]] = false;
        }

        // Set new authorizations
        contributor.wallets = wallets;
        for (uint256 i = 0; i < wallets.length; i++) {
            _authorizedWallets[wallets[i]] = true;
        }

        contributor.allocatedTokens = allocatedTokens;

        emit ContributorUpdated(identifier, wallets);
    }

    /**
     * @notice Calculates daily token claim limit
     * @return uint256 Daily maximum claimable tokens
     * @dev Formula: Base Supply (50M) + Previous Day Claims
     */
    function _calculateDailyLimit() private view returns (uint256) {
        return DAILY_BASE_SUPPLY + _previousDayClaim;
    }

    /**
     * @notice Updates daily claim limit
     * @dev Updates limit and emits event
     *      Used during day transitions
     */
    function _updateDailyLimit() private {
        unchecked {
            _maxDailyLimit = _calculateDailyLimit();
        }
        emit DailyLimitUpdated(_maxDailyLimit, _previousDayClaim);
    }

    // ======== Claim Processing ========

    /**
     * @notice Process token claims for contributors
     * @param amount Requested claim amount
     * @dev Claim processing sequence:
     *      1. Authorization verification
     *      2. Allocation check
     *      3. Day transition processing if needed
     *      4. Available amount calculation
     *      5. State updates and minting
     * 
     * State Transitions:
     * - Updates contributor claimed tokens
     * - Updates daily minted amount
     * - Updates day transition state if needed
     * - Mints new tokens
     * 
     * Debug Events:
     * - After day transition: Shows new limit state
     * - Before claim: Shows available supply
     * 
     * Error Cases:
     * - Unauthorized wallet
     * - Exceeds allocation
     * - No tokens available
     */
    function claimTokens(uint256 amount) external nonReentrant {
        require(_authorizedWallets[msg.sender], "Unauthorized wallet");

        Contributor storage contributor = _contributors[msg.sender];
        unchecked {
            require(contributor.claimedTokens + amount <= contributor.allocatedTokens, "Exceeds allocation");
        }

        uint256 currentTime = block.timestamp;
        uint256 elapsedDays = daysElapsed(_lastProcessedTime);

        // Handle day transition
        if (elapsedDays > 0) {
            uint256 previousDayTotal = _dailyMintedAmount;
            _dailyMintedAmount = 0;
            
            if (elapsedDays == 1) {
                // If exactly one day has passed, use the full previous day's claims
                _previousDayClaim = previousDayTotal;
            } else {
                // If multiple days have passed, reset previous day claims to 0
                _previousDayClaim = 0;
            }

            _lastProcessedTime = currentTime;
            _updateDailyLimit();

            emit DebugClaimProcess(
                "After Day Transition",
                amount,
                _maxDailyLimit,
                _dailyMintedAmount,
                _maxDailyLimit,
                0
            );
        }

        if (amount == 0) {
            emit TokensClaimed(msg.sender, 0);
            return;
        }

        unchecked {
            // Calculate available supply
            uint256 remainingDailySupply = _maxDailyLimit > _dailyMintedAmount ? 
                _maxDailyLimit - _dailyMintedAmount : 0;
                
            require(remainingDailySupply > 0, "No tokens available today");

            // Calculate claim amount
            uint256 claimAmount = amount <= remainingDailySupply ? amount : remainingDailySupply;

            emit DebugClaimProcess(
                "Before Claim",
                amount,
                _maxDailyLimit,
                _dailyMintedAmount,
                remainingDailySupply,
                claimAmount
            );

            // Update state
            contributor.claimedTokens += claimAmount;
            _dailyMintedAmount += claimAmount;
            _mint(msg.sender, claimAmount);

            emit TokensClaimed(msg.sender, claimAmount);

            if (claimAmount < amount) {
                emit ClaimStatus(msg.sender, string(
                    abi.encodePacked(
                        "Partial claim processed: ",
                        _uintToString(claimAmount / 1 ether),
                        " tokens claimed. ",
                        _uintToString((amount - claimAmount) / 1 ether),
                        " tokens unfilled due to daily limits."
                    )
                ));
            }
        }
    }

    // ======== View Functions ========

    /**
     * @notice Gets contributor claim information
     * @param contributorAddress Address to query
     * @return maxDailyClaimLimit Current maximum daily limit
     * @return totalRemainingDayClaim Available tokens today
     * @return registeredWallets Array of contributor's authorized wallets
     * @return tokensClaimedPerWallet Array of claims per wallet
     * @return totalAllocation Total allocated tokens for contributor
     * @return unclaimedAllocation Remaining unclaimed allocation
     * @return estimatedAvailableClaim Estimated claimable amount right now
     */
    function getContributorClaimInfo(address contributorAddress) 
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
    {
        Contributor storage contributor = _contributors[contributorAddress];
        require(contributor.wallets.length > 0, "Contributor not found");

        maxDailyClaimLimit = DAILY_BASE_SUPPLY + _previousDayClaim;
        
        totalRemainingDayClaim = maxDailyClaimLimit > _dailyMintedAmount ? 
            maxDailyClaimLimit - _dailyMintedAmount : 0;

        registeredWallets = contributor.wallets;
        
        tokensClaimedPerWallet = new uint256[](contributor.wallets.length);
        for (uint256 i = 0; i < contributor.wallets.length; i++) {
            tokensClaimedPerWallet[i] = contributor.claimedTokens;
        }

        totalAllocation = contributor.allocatedTokens;
        unclaimedAllocation = contributor.allocatedTokens - contributor.claimedTokens;
        estimatedAvailableClaim = totalRemainingDayClaim < unclaimedAllocation ? 
            totalRemainingDayClaim : unclaimedAllocation;
    }

    /**
     * @notice Gets current day's minted amount
     * @return uint256 Total tokens minted today
     */
    function getDailyMintedAmount() external view returns (uint256) {
        return _dailyMintedAmount;
    }

    /**
     * @notice Gets previous day's total claims
     * @return uint256 Previous day's claimed tokens
     */
    function getPreviousDayClaim() external view returns (uint256) {
        return _previousDayClaim;
    }

    /**
     * @notice Gets current maximum daily claim limit
     * @return uint256 Current maximum daily limit
     */
    function getCurrentMaxDailyLimit() external view returns (uint256) {
        return DAILY_BASE_SUPPLY + _previousDayClaim;
    }

    /**
     * @notice Gets last processed claim timestamp
     * @return uint256 Last claim timestamp in UTC
     */
    function getLastProcessedTime() external view returns (uint256) {
        return _lastProcessedTime;
    }

    /**
     * @notice Checks if wallet is authorized
     * @param wallet Address to check
     * @return bool True if wallet is authorized
     */
    function isWalletAuthorized(address wallet) external view returns (bool) {
        return _authorizedWallets[wallet];
    }

    /**
     * @notice Gets contributor information
     * @param contributorAddress Address to query
     * @return identifier Contributor's unique identifier
     * @return wallets Array of authorized wallet addresses
     * @return allocatedTokens Total token allocation
     * @return claimedTokens Total claimed tokens
     */
    function getContributor(address contributorAddress) 
        external 
        view 
        returns (
            string memory identifier,
            address[] memory wallets,
            uint256 allocatedTokens,
            uint256 claimedTokens
        ) 
    {
        Contributor storage contributor = _contributors[contributorAddress];
        return (
            contributor.identifier,
            contributor.wallets,
            contributor.allocatedTokens,
            contributor.claimedTokens
        );
    }

    /**
     * @notice Gets DST configuration status
     * @return manualOverride Current override status
     * @return daylightSavingsActive Current DST status
     * @return dstStart DST start timestamp for current year
     * @return dstEnd DST end timestamp for current year
     */
    function getDSTStatus() 
        external 
        view 
        returns (
            bool manualOverride,
            bool daylightSavingsActive,
            uint256 dstStart,
            uint256 dstEnd
        ) 
    {
        return (
            _manualOverride,
            _daylightSavingsActive,
            _dstStartTimestamp,
            _dstEndTimestamp
        );
    }

    /**
     * @notice Calculates days elapsed between timestamps
     * @param lastClaimTimestamp Previous claim timestamp
     * @return uint256 Number of days elapsed in Mountain Time
     */
    function daysElapsed(uint256 lastClaimTimestamp) public view returns (uint256) {
        uint256 currentMountainTime = toMountainTime(block.timestamp);
        uint256 lastClaimMountainTime = toMountainTime(lastClaimTimestamp);
        return (currentMountainTime / SECONDS_IN_A_DAY) - 
               (lastClaimMountainTime / SECONDS_IN_A_DAY);
    }

    /**
     * @notice Converts UTC timestamp to Mountain Time
     * @param timestamp UTC timestamp
     * @return uint256 Mountain Time timestamp
     */
    function toMountainTime(uint256 timestamp) public view returns (uint256) {
        int256 offset = _getCurrentUTCOffset();
        return uint256(int256(timestamp) + offset);
    }

    /**
     * @notice Gets current UTC offset for Mountain Time
     * @return int256 Current offset in seconds
     */
    function getCurrentUTCOffset() external view returns (int256) {
        return _getCurrentUTCOffset();
    }

    // ======== Private Utility Functions ========

    /**
     * @notice Gets current UTC offset based on DST status
     * @return int256 Offset in seconds (-6 or -7 hours)
     * @dev Handles both manual override and automatic DST
     */
    function _getCurrentUTCOffset() private view returns (int256) {
        if (_manualOverride) {
            return _daylightSavingsActive ? -6 * 3600 : -7 * 3600;
        }

        if (block.timestamp >= _dstStartTimestamp && 
            block.timestamp < _dstEndTimestamp) {
            return -6 * 3600; // DST active (-6 hours)
        } else {
            return -7 * 3600; // Standard time (-7 hours)
        }
    }

    /**
     * @notice Updates DST transition timestamps
     * @dev Called during initialization
     *      Sets start and end times for current year
     */
    function _updateDaylightSavings() private {
        _dstStartTimestamp = _calculateDSTStart(block.timestamp);
        _dstEndTimestamp = _calculateDSTEnd(block.timestamp);
    }

    /**
     * @notice Calculates DST start timestamp
     * @param timestamp Current UTC timestamp
     * @return uint256 DST start timestamp
     * @dev Start = March 12th (60 days + 7 days into year)
     */
    function _calculateDSTStart(uint256 timestamp) private pure returns (uint256) {
        uint256 year = (timestamp / 365 days) + 1970;
        return year * 365 days + 60 days + 7 days;
    }

    /**
     * @notice Calculates DST end timestamp
     * @param timestamp Current UTC timestamp
     * @return uint256 DST end timestamp
     * @dev End = November 5th (304 days into year)
     */
    function _calculateDSTEnd(uint256 timestamp) private pure returns (uint256) {
        uint256 year = (timestamp / 365 days) + 1970;
        return year * 365 days + 304 days;
    }

    /**
     * @notice Converts uint256 to string
     * @param value Number to convert
     * @return string String representation
     * @dev Used for constructing error messages
     */
    function _uintToString(uint256 value) private pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}