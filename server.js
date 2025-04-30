const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ethers } = require('ethers');
const axios = require('axios');
require('dotenv').config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Ethereum provider
const ethProvider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL);
const ethWallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, ethProvider);

// Initialize BNB Chain provider
const bnbProvider = new ethers.providers.JsonRpcProvider(process.env.BNB_RPC_URL);
const bnbWallet = new ethers.Wallet(process.env.BNB_PRIVATE_KEY, bnbProvider);

// Load contract ABIs
const NFTLockABI = require('./abis/NFTLock.json');
const NFAMinterABI = require('./abis/NFAMinter.json');
const ERC721ABI = require('./abis/ERC721.json');

// Initialize contract instances
const nftLockContract = new ethers.Contract(
  process.env.BRIDGE_CONTRACT_ADDRESS_ETH,
  NFTLockABI,
  ethWallet
);

const nfaMinterContract = new ethers.Contract(
  process.env.BRIDGE_CONTRACT_ADDRESS_BNB,
  NFAMinterABI,
  bnbWallet
);

// Helper function to fetch NFT metadata
async function fetchNFTMetadata(nftContract, tokenId) {
  try {
    const erc721Contract = new ethers.Contract(nftContract, ERC721ABI, ethProvider);
    const tokenURI = await erc721Contract.tokenURI(tokenId);
    
    // Handle IPFS URIs
    let metadataUrl = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      metadataUrl = `https://ipfs.io/ipfs/${tokenURI.replace('ipfs://', '')}`;
    }
    
    const response = await axios.get(metadataUrl);
    return response.data;
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    throw error;
  }
}

// Helper function to prepare agent data from NFT metadata
function prepareAgentData(metadata) {
  // This is a simplified example - in a real implementation,
  // you would extract relevant information from the NFT metadata
  // to create the agent data according to the BEP007 standard
  
  const agentData = {
    name: metadata.name || 'Unknown Agent',
    description: metadata.description || '',
    image: metadata.image || '',
    attributes: metadata.attributes || [],
    // Add BEP007 specific fields
    agentType: 'NFT-derived',
    capabilities: ['chat', 'image-generation'],
    version: '1.0.0'
  };
  
  return ethers.utils.defaultAbiCoder.encode(
    ['string', 'string', 'string', 'string'],
    [
      agentData.name,
      agentData.description,
      JSON.stringify(agentData.attributes),
      JSON.stringify(agentData.capabilities)
    ]
  );
}

// Helper function to upload metadata to IPFS
async function uploadToIPFS(metadata) {
  try {
    // In a real implementation, you would use an IPFS client library
    // or a service like Pinata, NFT.Storage, etc.
    // This is a simplified example using a hypothetical API
    
    const response = await axios.post('https://api.ipfs.example/upload', metadata, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.IPFS_API_KEY,
        'X-API-Secret': process.env.IPFS_API_SECRET
      }
    });
    
    return `ipfs://${response.data.cid}`;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

// API endpoint to initiate the bridge process
app.post('/api/bridge', async (req, res) => {
  try {
    const { nftContract, tokenId, ownerAddress } = req.body;
    
    // Verify that the NFT is locked
    const isLocked = await nftLockContract.isLocked(nftContract, tokenId);
    if (!isLocked) {
      return res.status(400).json({ error: 'NFT is not locked' });
    }
    
    // Verify that the owner is correct
    const originalOwner = await nftLockContract.getOriginalOwner(nftContract, tokenId);
    if (originalOwner.toLowerCase() !== ownerAddress.toLowerCase()) {
      return res.status(400).json({ error: 'Not the original owner' });
    }
    
    // Fetch NFT metadata
    const metadata = await fetchNFTMetadata(nftContract, tokenId);
    
    // Prepare agent data
    const agentData = prepareAgentData(metadata);
    
    // Upload metadata to IPFS
    const nfaMetadata = {
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      attributes: metadata.attributes,
      originalContract: nftContract,
      originalTokenId: tokenId,
      originalOwner: ownerAddress
    };
    const metadataURI = await uploadToIPFS(nfaMetadata);
    
    // Mint the NFA on BNB Chain
    const tx = await nfaMinterContract.mintNFA(
      nftContract,
      tokenId,
      ownerAddress,
      metadataURI,
      agentData
    );
    
    const receipt = await tx.wait();
    
    // Extract the NFA token ID from the event logs
    const mintEvent = receipt.events.find(e => e.event === 'NFAMinted');
    const nfaTokenId = mintEvent.args.nfaTokenId.toString();
    
    res.json({
      success: true,
      nfaTokenId,
      transactionHash: receipt.transactionHash
    });
  } catch (error) {
    console.error('Error bridging NFT to NFA:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to initiate the unlock process
app.post('/api/unlock', async (req, res) => {
  try {
    const { nfaTokenId } = req.body;
    
    // Get the Ethereum NFT details from the NFA
    const ethNFTDetails = await nfaMinterContract.getEthNFTForNFA(nfaTokenId);
    
    // Burn the NFA
    const burnTx = await nfaMinterContract.burnNFA(nfaTokenId);
    await burnTx.wait();
    
    // Unlock the NFT
    const unlockTx = await nftLockContract.unlockNFT(
      ethNFTDetails.nftContract,
      ethNFTDetails.tokenId
    );
    const receipt = await unlockTx.wait();
    
    res.json({
      success: true,
      transactionHash: receipt.transactionHash
    });
  } catch (error) {
    console.error('Error unlocking NFT:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get bridge status
app.get('/api/status/:nftContract/:tokenId', async (req, res) => {
  try {
    const { nftContract, tokenId } = req.params;
    
    // Check if the NFT is locked
    const isLocked = await nftLockContract.isLocked(nftContract, tokenId);
    
    if (!isLocked) {
      return res.json({
        status: 'not_locked',
        message: 'NFT is not locked in the bridge'
      });
    }
    
    // Get the NFA token ID if it exists
    const nfaTokenId = await nfaMinterContract.getNFAForEthNFT(nftContract, tokenId);
    
    if (nfaTokenId.toString() === '0') {
      return res.json({
        status: 'locked',
        message: 'NFT is locked but NFA has not been minted yet'
      });
    }
    
    res.json({
      status: 'bridged',
      nfaTokenId: nfaTokenId.toString(),
      message: 'NFT is locked and NFA has been minted'
    });
  } catch (error) {
    console.error('Error getting bridge status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
