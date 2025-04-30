import React from 'react';

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <div className="footer-links">
            <a href="#">About</a>
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="https://github.com/christelbuchanan/bep007-non-fungible-agents-nfa" target="_blank" rel="noopener noreferrer">BEP007 Standard</a>
          </div>
          <p>&copy; {new Date().getFullYear()} NFT to NFA Bridge. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
