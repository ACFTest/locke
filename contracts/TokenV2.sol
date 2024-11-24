// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Token.sol";

/**
 * @title Locke Token V2 (LOCKE)
 * @dev Upgraded Token contract for demonstration purposes.
 * Note: This contract is only for testing upgradability and is not intended for production use.
 */
contract TokenV2 is Token {
    /**
     * @dev Returns the version of the contract.
     */
    function getVersion() public pure returns (string memory) {
        return "Version 2";
    }
}

