import React from 'react';

const Header = ({ ethAccount, bnbAccount, activeTab, onTabChange }) => {
  const shortenAddress = (address) => {
    if (!address) return 'Not Connected';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <header>
      <div className="container">
        <div className="header-content">
          <div className="logo">NFT ↔ NFA Bridge</div>
          
          <nav className="nav-links">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onTabChange('bridge'); }}
              className={activeTab === 'bridge' ? 'active' : ''}
            >
              Bridge
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onTabChange('nfts'); }}
              className={activeTab === 'nfts' ? 'active' : ''}
            >
              My NFTs
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onTabChange('status'); }}
              className={activeTab === 'status' ? 'active' : ''}
            >
              Bridge Status
            </a>
          </nav>
          
          <div className="wallet-status">
            <div>
              <div className={`status-indicator ${ethAccount ? 'status-connected' : 'status-disconnected'}`}></div>
              <span>ETH: {shortenAddress(ethAccount)}</span>
            </div>
            <div>
              <div className={`status-indicator ${bnbAccount ? 'status-connected' : 'status-disconnected'}`}></div>
              <span>BNB: {shortenAddress(bnbAccount)}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
