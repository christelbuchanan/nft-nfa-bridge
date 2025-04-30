# NFT to NFA Bridge

A bridge that allows Ethereum NFT owners to lock their NFTs and mint corresponding Non-Fungible Agents (NFAs) on BNB Chain using the BEP007 standard.

## Overview

This project implements a cross-chain bridge between Ethereum and BNB Chain that enables:

1. Locking an NFT (e.g., Bored Ape) on Ethereum
2. Minting a corresponding NFA on BNB Chain with agent capabilities
3. Unlocking the original NFT by burning the NFA

## Architecture

The bridge consists of the following components:

### Ethereum Side
- `NFTLock.sol`: Smart contract for locking NFTs on Ethereum
- Handles the safe storage of locked NFTs
- Maintains a record of original owners

### BNB Chain Side
- `NFAMinter.sol`: Smart contract for minting NFAs on BNB Chain
- Implements the BEP007 standard for Non-Fungible Agents
- Maintains a mapping between Ethereum NFTs and BNB Chain NFAs

### Bridge Server
- Monitors events on both chains
- Facilitates the cross-chain communication
- Handles metadata transformation and IPFS storage

### Frontend
- User interface for interacting with the bridge
- Wallet connection for both Ethereum and BNB Chain
- NFT browsing and bridge status monitoring

## How It Works

1. **Lock NFT**: User approves and locks their NFT in the `NFTLock` contract on Ethereum
2. **Bridge Processing**: The bridge server detects the lock event and prepares the NFA metadata
3. **Mint NFA**: The bridge server triggers the minting of an NFA on BNB Chain
4. **Use Agent**: The user can now use their NFA with agent capabilities on BNB Chain
5. **Unlock (Optional)**: User can burn their NFA to unlock the original NFT on Ethereum

## BEP007 Integration

The NFAs minted on BNB Chain implement the BEP007 standard for Non-Fungible Agents, which extends the ERC721 standard with agent capabilities:

- Agent data storage
- Agent interaction methods
- Agent execution environment

## Development

### Prerequisites
- Node.js and npm
- MetaMask or another web3 wallet
- Access to Ethereum and BNB Chain networks

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables in `.env`
4. Start the development server: `npm run dev`

### Smart Contract Deployment
1. Deploy `NFTLock.sol` to Ethereum
2. Deploy the BEP007 NFA contract to BNB Chain
3. Deploy `NFAMinter.sol` to BNB Chain
4. Update the contract addresses in the `.env` file

## Security Considerations

- The bridge uses a lock-and-mint pattern rather than burning NFTs
- Original NFTs are safely stored in the bridge contract
- Only the original owner can unlock their NFT
- The bridge maintains a strict 1:1 relationship between NFTs and NFAs

## License

MIT
