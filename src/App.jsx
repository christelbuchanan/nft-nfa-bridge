import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Header from './components/Header';
import Footer from './components/Footer';
import BridgeForm from './components/BridgeForm';
import NFTList from './components/NFTList';
import BridgeStatus from './components/BridgeStatus';
import Steps from './components/Steps';

const App = () => {
  const [activeTab, setActiveTab] = useState('bridge');
  const [ethAccount, setEthAccount] = useState(null);
  const [bnbAccount, setBnbAccount] = useState(null);
  const [ethProvider, setEthProvider] = useState(null);
  const [bnbProvider, setBnbProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const connectWallet = async () => {
      if (window.ethereum) {
        try {
          // Connect to Ethereum
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          await provider.send("eth_requestAccounts", []);
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          
          setEthProvider(provider);
          setEthAccount(address);
          
          // Check if BNB Chain is available
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x38' }], // BNB Chain
            });
            
            const bnbProvider = new ethers.providers.Web3Provider(window.ethereum);
            await bnbProvider.send("eth_requestAccounts", []);
            const bnbSigner = bnbProvider.getSigner();
            const bnbAddress = await bnbSigner.getAddress();
            
            setBnbProvider(bnbProvider);
            setBnbAccount(bnbAddress);
            
            // Switch back to Ethereum
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x1' }], // Ethereum Mainnet
            });
          } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: '0x38',
                      chainName: 'BNB Chain',
                      nativeCurrency: {
                        name: 'BNB',
                        symbol: 'BNB',
                        decimals: 18,
                      },
                      rpcUrls: ['https://bsc-dataseed.binance.org/'],
                      blockExplorerUrls: ['https://bscscan.com/'],
                    },
                  ],
                });
              } catch (addError) {
                console.error('Error adding BNB Chain:', addError);
              }
            }
            console.error('Error switching to BNB Chain:', switchError);
          }
        } catch (error) {
          console.error('Error connecting to wallet:', error);
          setError('Failed to connect to wallet. Please try again.');
        }
      } else {
        setError('Ethereum wallet not detected. Please install MetaMask.');
      }
    };

    connectWallet();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Clear messages when changing tabs
    setError(null);
    setSuccess(null);
  };

  return (
    <div>
      <Header 
        ethAccount={ethAccount} 
        bnbAccount={bnbAccount} 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
      
      <main className="container">
        <div className="hero">
          <h1>NFT to NFA Bridge</h1>
          <p>
            Lock your Ethereum NFTs and mint corresponding Non-Fungible Agents (NFAs) on BNB Chain.
            Unlock your NFTs anytime by burning the corresponding NFAs.
          </p>
          <a href="#how-it-works" className="btn">Learn How It Works</a>
        </div>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}
        
        <Steps />
        
        {activeTab === 'bridge' && (
          <div className="card">
            <h2 className="card-title">Bridge Your NFT to NFA</h2>
            <BridgeForm 
              ethAccount={ethAccount}
              ethProvider={ethProvider}
              setLoading={setLoading}
              setError={setError}
              setSuccess={setSuccess}
            />
          </div>
        )}
        
        {activeTab === 'nfts' && (
          <div className="card">
            <h2 className="card-title">Your NFTs</h2>
            <NFTList 
              ethAccount={ethAccount}
              ethProvider={ethProvider}
              setLoading={setLoading}
              setError={setError}
            />
          </div>
        )}
        
        {activeTab === 'status' && (
          <div className="card">
            <h2 className="card-title">Bridge Status</h2>
            <BridgeStatus 
              ethAccount={ethAccount}
              ethProvider={ethProvider}
              bnbProvider={bnbProvider}
              setLoading={setLoading}
              setError={setError}
              setSuccess={setSuccess}
            />
          </div>
        )}
        
        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        )}
        
        <div className="card" id="how-it-works">
          <h2 className="card-title">How It Works</h2>
          <div>
            <h3>Bridging NFT to NFA</h3>
            <ol>
              <li>Connect your wallet to both Ethereum and BNB Chain</li>
              <li>Select the NFT you want to bridge</li>
              <li>Approve the NFT for locking in the bridge contract</li>
              <li>Confirm the transaction to lock your NFT</li>
              <li>Wait for the bridge to mint your NFA on BNB Chain</li>
              <li>Receive your NFA with agent capabilities based on BEP007 standard</li>
            </ol>
            
            <h3>Unlocking Your NFT</h3>
            <ol>
              <li>Go to the Bridge Status tab</li>
              <li>Find your bridged NFT</li>
              <li>Click "Unlock NFT"</li>
              <li>Confirm the transaction to burn your NFA</li>
              <li>Wait for the bridge to unlock your original NFT</li>
              <li>Receive your NFT back in your Ethereum wallet</li>
            </ol>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default App;
