// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NFTLock
 * @dev Contract for locking NFTs on Ethereum to be bridged to BNB Chain as NFAs
 */
contract NFTLock is ERC721Holder, Ownable, ReentrancyGuard {
    // Mapping from NFT contract address and token ID to lock status
    mapping(address => mapping(uint256 => bool)) public lockedNFTs;
    
    // Mapping from NFT contract address and token ID to owner
    mapping(address => mapping(uint256 => address)) public originalOwners;
    
    // Events
    event NFTLocked(address indexed nftContract, uint256 indexed tokenId, address indexed owner);
    event NFTUnlocked(address indexed nftContract, uint256 indexed tokenId, address indexed owner);
    
    /**
     * @dev Lock an NFT to be bridged to BNB Chain
     * @param nftContract The address of the NFT contract
     * @param tokenId The ID of the token to lock
     */
    function lockNFT(address nftContract, uint256 tokenId) external nonReentrant {
        require(!lockedNFTs[nftContract][tokenId], "NFT already locked");
        
        // Transfer the NFT to this contract
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);
        
        // Mark the NFT as locked
        lockedNFTs[nftContract][tokenId] = true;
        originalOwners[nftContract][tokenId] = msg.sender;
        
        emit NFTLocked(nftContract, tokenId, msg.sender);
    }
    
    /**
     * @dev Unlock an NFT and return it to the original owner
     * @param nftContract The address of the NFT contract
     * @param tokenId The ID of the token to unlock
     */
    function unlockNFT(address nftContract, uint256 tokenId) external nonReentrant {
        require(lockedNFTs[nftContract][tokenId], "NFT not locked");
        
        // Only the original owner or the contract owner can unlock
        address originalOwner = originalOwners[nftContract][tokenId];
        require(msg.sender == originalOwner || msg.sender == owner(), "Not authorized to unlock");
        
        // Mark the NFT as unlocked
        lockedNFTs[nftContract][tokenId] = false;
        
        // Transfer the NFT back to the original owner
        IERC721(nftContract).safeTransferFrom(address(this), originalOwner, tokenId);
        
        emit NFTUnlocked(nftContract, tokenId, originalOwner);
    }
    
    /**
     * @dev Check if an NFT is locked
     * @param nftContract The address of the NFT contract
     * @param tokenId The ID of the token to check
     * @return bool Whether the NFT is locked
     */
    function isLocked(address nftContract, uint256 tokenId) external view returns (bool) {
        return lockedNFTs[nftContract][tokenId];
    }
    
    /**
     * @dev Get the original owner of a locked NFT
     * @param nftContract The address of the NFT contract
     * @param tokenId The ID of the token to check
     * @return address The original owner of the NFT
     */
    function getOriginalOwner(address nftContract, uint256 tokenId) external view returns (address) {
        return originalOwners[nftContract][tokenId];
    }
}
