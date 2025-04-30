// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IBEP007
 * @dev Interface for the BEP007 Non-Fungible Agent standard
 */
interface IBEP007 {
    /**
     * @dev Mint a new NFA
     * @param to The address that will own the NFA
     * @param uri The metadata URI for the NFA
     * @param agentData The agent data for the NFA
     * @return uint256 The ID of the minted NFA
     */
    function mint(address to, string memory uri, bytes memory agentData) external returns (uint256);
    
    /**
     * @dev Burn an NFA
     * @param tokenId The ID of the NFA to burn
     */
    function burn(uint256 tokenId) external;
    
    /**
     * @dev Get the agent data for an NFA
     * @param tokenId The ID of the NFA
     * @return bytes The agent data
     */
    function getAgentData(uint256 tokenId) external view returns (bytes memory);
    
    /**
     * @dev Set the agent data for an NFA
     * @param tokenId The ID of the NFA
     * @param agentData The new agent data
     */
    function setAgentData(uint256 tokenId, bytes memory agentData) external;
    
    /**
     * @dev Get the URI for an NFA
     * @param tokenId The ID of the NFA
     * @return string The URI
     */
    function tokenURI(uint256 tokenId) external view returns (string memory);
}
