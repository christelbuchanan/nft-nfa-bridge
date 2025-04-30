import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const NFTList = ({ ethAccount, ethProvider, setLoading, setError }) => {
  const [nfts, setNfts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('all');
  
  // Sample collections for demonstration
  // In a real app, you would fetch these from an API or blockchain
  const SAMPLE_COLLECTIONS = [
    { address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', name: 'Bored Ape Yacht Club' },
    { address: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB', name: 'CryptoPunks' },
    { address: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6', name: 'Mutant Ape Yacht Club' },
    { address: '0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e', name: 'Doodles' },
    { address: '0xED5AF388653567Af2F388E6224dC7C4b3241C544', name: 'Azuki' }
  ];
  
  useEffect(() => {
    setCollections(SAMPLE_COLLECTIONS);
  }, []);
  
  const fetchNFTs = async (collectionAddress) => {
    if (!ethProvider || !ethAccount) {
      setError('Wallet not connected');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // In a real application, you would use an API like Moralis, Alchemy, or Covalent
      // to fetch NFTs owned by the user. For this example, we'll simulate it.
      
      // Simulated NFT data for demonstration
      const simulatedNFTs = [];
      
      if (collectionAddress === 'all' || collectionAddress === '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D') {
        simulatedNFTs.push({
          contract: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
          tokenId: '1234',
          name: 'Bored Ape #1234',
          collection: 'Bored Ape Yacht Club',
          image: 'https://ipfs.io/ipfs/QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/1234'
        });
      }
      
      if (collectionAddress === 'all' || collectionAddress === '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB') {
        simulatedNFTs.push({
          contract: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
          tokenId: '5678',
          name: 'CryptoPunk #5678',
          collection: 'CryptoPunks',
          image: 'https://cryptopunks.app/cryptopunks/cryptopunk5678.png'
        });
      }
      
      setNfts(simulatedNFTs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setError('Failed to fetch NFTs. Please try again.');
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (ethAccount) {
      fetchNFTs(selectedCollection);
    }
  }, [ethAccount, selectedCollection]);
  
  const handleCollectionChange = (e) => {
    setSelectedCollection(e.target.value);
  };
  
  return (
    <div>
      <div className="form-group">
        <label htmlFor="collection">Filter by Collection</label>
        <select
          id="collection"
          value={selectedCollection}
          onChange={handleCollectionChange}
        >
          <option value="all">All Collections</option>
          {collections.map((collection) => (
            <option key={collection.address} value={collection.address}>
              {collection.name}
            </option>
          ))}
        </select>
      </div>
      
      {nfts.length > 0 ? (
        <div className="nft-grid">
          {nfts.map((nft) => (
            <div key={`${nft.contract}-${nft.tokenId}`} className="nft-card">
              <img 
                src={nft.image} 
                alt={nft.name} 
                className="nft-image" 
              />
              <div className="nft-info">
                <div className="nft-name">{nft.name}</div>
                <div className="nft-collection">{nft.collection}</div>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    window.location.hash = '#';
                    // In a real app, you would navigate to the bridge page
                    // and pre-fill the form with this NFT's details
                  }}
                >
                  Bridge This NFT
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No NFTs found. Please connect your wallet or select a different collection.</p>
      )}
    </div>
  );
};

export default NFTList;
