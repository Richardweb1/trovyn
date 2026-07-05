# Trovyn

Trovyn is a GenLayer lost-and-found matching app. A user submits a lost-item description and a found-item description; independent validators compare distinctive details and record a `MATCH` or `NO_MATCH` verdict with confidence and reasoning on-chain.

## Live deployment

- App: https://trovyn.vercel.app


## Network

- Network: GenLayer Bradbury Testnet (Chain ID `4221`)
- RPC: `https://rpc-bradbury.genlayer.com`
- Explorer: https://explorer-bradbury.genlayer.com
- Contract: 0xFF1d6e786EBb1a9C9CAAc14853c19bcDc3A10079`
-
- (https://explorer-bradbury.genlayer.com/address/0xFF1d6e786EBb1a9C9CAAc14853c19bcDc3A10079)

- Deployment transaction:`0x3f46061bd7eaa8f83b8c3d6ec4ba51259525ee5d86800280253a741de77e7b45`
-
- https://explorer-bradbury.genlayer.com/tx/0x3f46061bd7eaa8f83b8c3d6ec4ba51259525ee5d86800280253a741de77e7b45 — `FINALIZED / AGREE`

- Verified app call: 0x811a6f808c8672ec8e987629dbe0fedc4e3375c8ad5dc639c7b12ab183d78675`
-
  https://explorer-bradbury.genlayer.com/tx/0x811a6f808c8672ec8e987629dbe0fedc4e3375c8ad5dc639c7b12ab183d78675 — `FINALIZED / AGREE`

## Deploy

1. Open GenLayer Studio on Bradbury Testnet.
2. Paste `contracts/trovyn.py` and deploy `Trovyn` with no constructor arguments.
3. Wait for the deployment transaction to become `FINALIZED`.
4. Add the address to `.env.local` as `VITE_CONTRACT_ADDRESS`.
5. Build and deploy the frontend.


```
