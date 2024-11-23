// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title Locke Token (LOCKE)
 * @dev ERC20 token with a maximum supply (capacity supply), minting, and burning capabilities.
 * Designed for upgradability using OpenZeppelin's proxy pattern.
 */
contract Token is Initializable, ERC20Upgradeable, ReentrancyGuardUpgradeable {
    // State variables
    uint256 private _capacitySupplyInternal; // Maximum number of tokens that can ever be minted
    address private _owner; // Contract owner address

    // Events
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed burner, uint256 amount);

    /**
     * @dev Initializes the token contract.
     * @param initialOwner Address of the initial owner of the contract.
     * @param maxCapacitySupply Maximum supply of tokens that can ever be minted.
     * @param initialSupply Initial supply of tokens minted to the owner.
     */
    function initialize(
        address initialOwner,
        uint256 maxCapacitySupply,
        uint256 initialSupply
    ) public initializer {
        require(initialOwner != address(0), "Owner cannot be the zero address");
        require(maxCapacitySupply > 0, "Capacity supply must be greater than zero");
        require(initialSupply <= maxCapacitySupply, "Initial supply exceeds capacity");

        __ERC20_init("Locke Token", "LOCKE");
        __ReentrancyGuard_init();

        _capacitySupplyInternal = maxCapacitySupply * 10 ** decimals(); // Set maximum supply
        _owner = initialOwner; // Set contract owner
        _mint(initialOwner, initialSupply * 10 ** decimals()); // Mint initial supply
    }

    /**
     * @dev Returns the maximum capacity supply of the token.
     */
    function capacitySupply() external view returns (uint256) {
        return _capacitySupplyInternal;
    }

    /**
     * @dev Returns the address of the contract owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Mints new tokens, ensuring the total supply does not exceed the capacity supply.
     * Can only be called by the owner.
     * @param to The address to receive the minted tokens.
     * @param amount The number of tokens to mint (in smallest units).
     */
    function mint(address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "Cannot mint to the zero address");
        require(amount > 0, "Mint amount must be greater than zero");
        require(totalSupply() + amount <= _capacitySupplyInternal, "Minting exceeds capacity supply");

        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Burns tokens from the owner's balance and reduces the total supply.
     * Only the owner can burn tokens.
     * @param amount The number of tokens to burn (in smallest units).
     */
    function burn(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Burn amount must be greater than zero");
        require(balanceOf(msg.sender) >= amount, "Burn amount exceeds balance");

        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @dev Modifier to restrict function access to the owner only.
     */
    modifier onlyOwner() {
        require(msg.sender == _owner, "Caller is not the owner");
        _;
    }

    /**
     * @dev Reserved storage gap to allow future upgrades.
     */
    uint256[50] private __gap;
}
