// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Token.sol";

/**
 * @title Locke Token V2 (LOCKE)
 * @dev Upgraded Token contract with additional functionality.
 */
contract TokenV2 is Token {
    event VersionUpdated(string version);

    /**
     * @dev Returns the version of the contract.
     */
    function getVersion() public pure returns (string memory) {
        return "Version 2";
    }

    /**
     * @dev Emits a VersionUpdated event with the version.
     */
    function setVersion() public {
        emit VersionUpdated(getVersion());
    }
}
