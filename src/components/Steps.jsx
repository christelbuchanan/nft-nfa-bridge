import React from 'react';

const Steps = () => {
  return (
    <div className="steps">
      <div className="step">
        <div className="step-number">1</div>
        <div className="step-title">Lock NFT</div>
        <div className="step-description">
          Lock your Ethereum NFT in the bridge contract
        </div>
      </div>
      
      <div className="step">
        <div className="step-number">2</div>
        <div className="step-title">Mint NFA</div>
        <div className="step-description">
          The bridge mints a corresponding NFA on BNB Chain
        </div>
      </div>
      
      <div className="step">
        <div className="step-number">3</div>
        <div className="step-title">Use Agent</div>
        <div className="step-description">
          Interact with your NFA using BEP007 agent capabilities
        </div>
      </div>
      
      <div className="step">
        <div className="step-number">4</div>
        <div className="step-title">Unlock (Optional)</div>
        <div className="step-description">
          Burn your NFA to unlock the original NFT anytime
        </div>
      </div>
    </div>
  );
};

export default Steps;
