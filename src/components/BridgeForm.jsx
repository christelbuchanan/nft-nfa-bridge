import React, { useState } from 'react';
import { ethers } from 'ethers';
import NFTLockABI from '../abis/NFTLock.json';
import ERC721ABI from '../abis/ERC721.json';

const BridgeForm = ({ ethAccount, ethProvider, setLoading, setError, setSuccess }) => {
  const [nftContract, setNftContract] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [nftDetails, setNftDetails] = useState(null);
  
  const BRIDGE_CONTRACT_ADDRESS = process.env.BRIDGE_CONTRACT_ADDRESS_ETH || '0x0000000000000000000000000000000000000000';
  
  const fetchNFTDetails = async () => {
    if (!ethProvider || !nftContract || !tokenId) {
      setError('Please provide a valid NFT contract address and token ID');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Create contract instance
      const erc721Contract = new ethers.Contract(nftContract, ERC721ABI, ethProvider);
      
      // Check if the NFT exists and is owned by the user
      const owner = await erc721Contract.ownerOf(tokenId);
      
      if (owner.toLowerCase() !== ethAccount.toLowerCase()) {
        setError('You do not own this NFT');
        setLoading(false);
        return;
      }
      
      // Get NFT metadata
      let tokenURI;
      try {
        tokenURI = await erc721Contract.tokenURI(tokenId);
      } catch (error) {
        console.error('Error fetching tokenURI:', error);
        setError('Failed to fetch NFT metadata. This NFT might not support the standard tokenURI method.');
        setLoading(false);
        return;
      }
      
      // Get NFT name and symbol
      let name, symbol;
      try {
        name = await erc721Contract.name();
        symbol = await erc721Contract.symbol();
      } catch (error) {
        console.error('Error fetching name/symbol:', error);
        name = 'Unknown Collection';
        symbol = 'UNKNOWN';
      }
      
      // Fetch metadata if tokenURI is available
      let metadata = {};
      if (tokenURI) {
        try {
          // Handle IPFS URIs
          let metadataUrl = tokenURI;
          if (tokenURI.startsWith('ipfs://')) {
            metadataUrl = `https://ipfs.io/ipfs/${tokenURI.replace('ipfs://', '')}`;
          }
          
          const response = await fetch(metadataUrl);
          metadata = await response.json();
        } catch (error) {
          console.error('Error fetching metadata:', error);
          metadata = { name: `${name} #${tokenId}`, image: '' };
        }
      }
      
      // Check if the NFT is already locked in the bridge
      const nftLockContract = new ethers.Contract(BRIDGE_CONTRACT_ADDRESS, NFTLockABI, ethProvider);
      const isLocked = await nftLockContract.isLocked(nftContract, tokenId);
      
      setNftDetails({
        contract: nftContract,
        tokenId,
        name: metadata.name || `${name} #${tokenId}`,
        image: metadata.image || '',
        collection: name,
        symbol,
        isLocked
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching NFT details:', error);
      setError('Failed to fetch NFT details. Please check the contract address and token ID.');
      setLoading(false);
    }
  };
  
  const handleApprove = async () => {
    if (!ethProvider || !nftDetails) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const signer = ethProvider.getSigner();
      const erc721Contract = new ethers.Contract(nftContract, ERC721ABI, signer);
      
      // Check if already approved
      const isApproved = await erc721Contract.isApprovedForAll(ethAccount, BRIDGE_CONTRACT_ADDRESS);
      if (isApproved) {
        setSuccess('NFT is already approved for the bridge');
        setLoading(false);
        return;
      }
      
      // Approve the bridge contract to transfer the NFT
      const tx = await erc721Contract.setApprovalForAll(BRIDGE_CONTRACT_ADDRESS, true);
      await tx.wait();
      
      setSuccess('NFT approved successfully! You can now lock it in the bridge.');
      setLoading(false);
    } catch (error) {
      console.error('Error approving NFT:', error);
      setError('Failed to approve NFT. Please try again.');
      setLoading(false);
    }
  };
  
  const handleLock = async () => {
    if (!ethProvider || !nftDetails) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const signer = ethProvider.getSigner();
      const nftLockContract = new ethers.Contract(BRIDGE_CONTRACT_ADDRESS, NFTLockABI, signer);
      
      // Lock the NFT
      const tx = await nftLockContract.lockNFT(nftContract, tokenId);
      const receipt = await tx.wait();
      
      setSuccess(`NFT locked successfully! Transaction hash: ${receipt.transactionHash}`);
      
      // Update NFT details
      setNftDetails({
        ...nftDetails,
        isLocked: true
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error locking NFT:', error);
      setError('Failed to lock NFT. Please try again.');
      setLoading(false);
    }
  };
  
  return (
    <div>
      <div className="form-group">
        <label htmlFor="nftContract">NFT Contract Address</label>
        <input
          type="text"
          id="nftContract"
          value={nftContract}
          onChange={(e) => setNftContract(e.target.value)}
          placeholder="0x..."
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="tokenId">Token ID</label>
        <input
          type="text"
          id="tokenId"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="123"
        />
      </div>
      
      <button className="btn btn-primary" onClick={fetchNFTDetails}>
        Fetch NFT Details
      </button>
      
      {nftDetails && (
        <div className="nft-details card" style={{ marginTop: '20px' }}>
          <h3>{nftDetails.name}</h3>
          <p>Collection: {nftDetails.collection} ({nftDetails.symbol})</p>
          
          {nftDetails.image && (
            <img 
              src={nftDetails.image.startsWith('ipfs://') 
                ? `https://ipfs.io/ipfs/${nftDetails.image.replace('ipfs://', '')}` 
                : nftDetails.image
              } 
              alt={nftDetails.name}
              style={{ maxWidth: '300px', marginTop: '10px' }}
            />
          )}
          
          <div style={{ marginTop: '20px' }}>
            {nftDetails.isLocked ? (
              <div>
                <p>This NFT is already locked in the bridge.</p>
                <p>Go to the Bridge Status tab to check the status of your bridged NFT.</p>
              </div>
            ) : (
              <div>
                <button className="btn" onClick={handleApprove} style={{ marginRight: '10px' }}>
                  1. Approve NFT
                </button>
                <button className="btn btn-primary" onClick={handleLock}>
                  2. Lock NFT
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BridgeForm;
