// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BEP007/IBEP007.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NFAMinter
 * @dev Contract for minting NFAs on BNB Chain based on locked Ethereum NFTs
 */
contract NFAMinter is Ownable, ReentrancyGuard {
    // The BEP007 NFA contract
    IBEP007 public nfaContract;
    
    // Mapping from Ethereum NFT (contract + tokenId) to BNB Chain NFA tokenId
    mapping(bytes32 => uint256) public ethToNfaMapping;
    
    // Mapping from BNB Chain NFA tokenId to Ethereum NFT details
    mapping(uint256 => EthNFTDetails) public nfaToEthMapping;
    
    // Structure to store Ethereum NFT details
    struct EthNFTDetails {
        address nftContract;
        uint256 tokenId;
        address originalOwner;
    }
    
    // Events
    event NFAMinted(
        address indexed ethNftContract, 
        uint256 indexed ethTokenId, 
        uint256 indexed nfaTokenId, 
        address owner
    );
    event NFABurned(uint256 indexed nfaTokenId);
    
    /**
     * @dev Constructor
     * @param _nfaContract The address of the BEP007 NFA contract
     */
    constructor(address _nfaContract) {
        nfaContract = IBEP007(_nfaContract);
    }
    
    /**
     * @dev Mint a new NFA based on a locked Ethereum NFT
     * @param ethNftContract The address of the Ethereum NFT contract
     * @param ethTokenId The ID of the Ethereum NFT
     * @param owner The address that will own the NFA
     * @param uri The metadata URI for the NFA
     * @param agentData The agent data for the NFA
     * @return uint256 The ID of the minted NFA
     */
    function mintNFA(
        address ethNftContract,
        uint256 ethTokenId,
        address owner,
        string memory uri,
        bytes memory agentData
    ) external onlyOwner nonReentrant returns (uint256) {
        bytes32 ethNftId = keccak256(abi.encodePacked(ethNftContract, ethTokenId));
        require(ethToNfaMapping[ethNftId] == 0, "NFA already minted for this NFT");
        
        // Mint the NFA
        uint256 nfaTokenId = nfaContract.mint(owner, uri, agentData);
        
        // Store the mappings
        ethToNfaMapping[ethNftId] = nfaTokenId;
        nfaToEthMapping[nfaTokenId] = EthNFTDetails({
            nftContract: ethNftContract,
            tokenId: ethTokenId,
            originalOwner: owner
        });
        
        emit NFAMinted(ethNftContract, ethTokenId, nfaTokenId, owner);
        
        return nfaTokenId;
    }
    
    /**
     * @dev Burn an NFA when the corresponding Ethereum NFT is unlocked
     * @param nfaTokenId The ID of the NFA to burn
     */
    function burnNFA(uint256 nfaTokenId) external onlyOwner nonReentrant {
        EthNFTDetails memory details = nfaToEthMapping[nfaTokenId];
        require(details.nftContract != address(0), "NFA not found");
        
        bytes32 ethNftId = keccak256(abi.encodePacked(details.nftContract, details.tokenId));
        
        // Clear the mappings
        delete ethToNfaMapping[ethNftId];
        delete nfaToEthMapping[nfaTokenId];
        
        // Burn the NFA
        nfaContract.burn(nfaTokenId);
        
        emit NFABurned(nfaTokenId);
    }
    
    /**
     * @dev Get the NFA token ID for a given Ethereum NFT
     * @param ethNftContract The address of the Ethereum NFT contract
     * @param ethTokenId The ID of the Ethereum NFT
     * @return uint256 The ID of the corresponding NFA
     */
    function getNFAForEthNFT(address ethNftContract, uint256 ethTokenId) external view returns (uint256) {
        bytes32 ethNftId = keccak256(abi.encodePacked(ethNftContract, ethTokenId));
        return ethToNfaMapping[ethNftId];
    }
    
    /**
     * @dev Get the Ethereum NFT details for a given NFA
     * @param nfaTokenId The ID of the NFA
     * @return EthNFTDetails The details of the corresponding Ethereum NFT
     */
    function getEthNFTForNFA(uint256 nfaTokenId) external view returns (EthNFTDetails memory) {
        return nfaToEthMapping[nfaTokenId];
    }
    
    /**
     * @dev Update the NFA contract address
     * @param _nfaContract The new NFA contract address
     */
    function updateNFAContract(address _nfaContract) external onlyOwner {
        nfaContract = IBEP007(_nfaContract);
    }
}
