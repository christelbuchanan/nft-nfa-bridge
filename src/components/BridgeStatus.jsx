import React, { useState } from 'react';
import { ethers } from 'ethers';
import NFTLockABI from '../abis/NFTLock.json';
import NFAMinterABI from '../abis/NFAMinter.json';

const BridgeStatus = ({ ethAccount, ethProvider, bnbProvider, setLoading, setError, setSuccess }) => {
  const [nftContract, setNftContract] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [bridgeStatus, setBridgeStatus] = useState(null);
  
  const BRIDGE_CONTRACT_ADDRESS_ETH = process.env.BRIDGE_CONTRACT_ADDRESS_ETH || '0x0000000000000000000000000000000000000000';
  const BRIDGE_CONTRACT_ADDRESS_BNB = process.env.BRIDGE_CONTRACT_ADDRESS_BNB || '0x0000000000000000000000000000000000000000';
  
  const checkStatus = async () => {
    if (!ethProvider || !bnbProvider || !nftContract || !tokenId) {
      setError('Please provide a valid NFT contract address and token ID');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if the NFT is locked
      const nftLockContract = new ethers.Contract(BRIDGE_CONTRACT_ADDRESS_ETH, NFTLockABI, ethProvider);
      const isLocked = await nftLockContract.isLocked(nftContract, tokenId);
      
      if (!isLocked) {
        setBridgeStatus({
          status: 'not_locked',
          message: 'This NFT is not locked in the bridge'
        });
        setLoading(false);
        return;
      }
      
      // Check if an NFA has been minted
      const nfaMinterContract = new ethers.Contract(BRIDGE_CONTRACT_ADDRESS_BNB, NFAMinterABI, bnbProvider);
      const nfaTokenId = await nfaMinterContract.getNFAForEthNFT(nftContract, tokenId);
      
      if (nfaTokenId.toString() === '0') {
        setBridgeStatus({
          status: 'locked',
          message: 'NFT is locked but NFA has not been minted yet',
          nftContract,
          tokenId,
          originalOwner: await nftLockContract.getOriginalOwner(nftContract, tokenId)
        });
      } else {
        setBridgeStatus({
          status: 'bridged',
          message: 'NFT is locked and NFA has been minted',
          nftContract,
          tokenId,
          nfaTokenId: nfaTokenId.toString(),
          originalOwner: await nftLockContract.getOriginalOwner(nftContract, tokenId)
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error checking bridge status:', error);
      setError('Failed to check bridge status. Please try again.');
      setLoading(false);
    }
  };
  
  const handleUnlock = async () => {
    if (!ethProvider || !bridgeStatus) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if the user is the original owner
      if (bridgeStatus.originalOwner.toLowerCase() !== ethAccount.toLowerCase()) {
        setError('You are not the original owner of this NFT');
        setLoading(false);
        return;
      }
      
      // If N<pivotalAction type="file" filePath="src/components/BridgeStatus.jsx">
      // If NFA has been minted, burn it first
      if (bridgeStatus.status === 'bridged') {
        const bnbSigner = bnbProvider.getSigner();
        const nfaMinterContract = new ethers.Contract(BRIDGE_CONTRACT_ADDRESS_BNB, NFAMinterABI, bnbSigner);
        
        // Switch to BNB Chain
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }], // BNB Chain
        });
        
        // Burn the NFA
        const burnTx = await nfaMinterContract.burnNFA(bridgeStatus.nfaTokenId);
        await burnTx.wait();
        
        // Switch back to Ethereum
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1' }], // Ethereum Mainnet
        });
      }
      
      // Unlock the NFT
      const ethSigner = ethProvider.getSigner();
      const nftLockContract = new ethers.Contract(BRIDGE_CONTRACT_ADDRESS_ETH, NFTLockABI, ethSigner);
      
      const unlockTx = await nftLockContract.unlockNFT(bridgeStatus.nftContract, bridgeStatus.tokenId);
      const receipt = await unlockTx.wait();
      
      setSuccess(`NFT unlocked successfully! Transaction hash: ${receipt.transactionHash}`);
      
      // Update bridge status
      setBridgeStatus({
        status: 'not_locked',
        message: 'NFT has been unlocked and returned to the original owner'
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error unlocking NFT:', error);
      setError('Failed to unlock NFT. Please try again.');
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
      
      <button className="btn btn-primary" onClick={checkStatus}>
        Check Bridge Status
      </button>
      
      {bridgeStatus && (
        <div className="bridge-status card" style={{ marginTop: '20px' }}>
          <h3>Bridge Status</h3>
          
          <div style={{ marginTop: '10px' }}>
            <p><strong>Status:</strong> {bridgeStatus.message}</p>
            
            {bridgeStatus.status === 'bridged' && (
              <p><strong>NFA Token ID:</strong> {bridgeStatus.nfaTokenId}</p>
            )}
            
            {(bridgeStatus.status === 'locked' || bridgeStatus.status === 'bridged') && (
              <div>
                {bridgeStatus.originalOwner && bridgeStatus.originalOwner.toLowerCase() === ethAccount.toLowerCase() && (
                  <button className="btn btn-primary" onClick={handleUnlock} style={{ marginTop: '10px' }}>
                    Unlock NFT
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BridgeStatus;
