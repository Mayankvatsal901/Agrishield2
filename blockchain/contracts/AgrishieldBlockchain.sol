// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

contract AgrishieldBlockchain {

    // ============================================
    // State Variables
    // ============================================

    mapping(string => string) private contractHashes;

    // ============================================
    // Event
    // ============================================

    event HashStored(

        string certificateNumber,

        string hash

    );

    // ============================================
    // Store Contract Hash
    // ============================================

    function storeHash(

        string memory certificateNumber,

        string memory hash

    ) public {

        contractHashes[certificateNumber] = hash;

        emit HashStored(

            certificateNumber,

            hash

        );

    }

    // ============================================
    // Verify Contract Hash
    // ============================================

    function verifyHash(

        string memory certificateNumber,

        string memory hash

    )

        public

        view

        returns(bool)

    {

        return keccak256(

            bytes(contractHashes[certificateNumber])

        ) == keccak256(

            bytes(hash)

        );

    }

    // ============================================
    // Get Stored Hash
    // ============================================

    function getHash(

        string memory certificateNumber

    )

        public

        view

        returns(string memory)

    {

        return contractHashes[certificateNumber];

    }

}