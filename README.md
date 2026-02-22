# QIS Fund - Alephium Hackathon

Welcome to QIS Fund, a tokenized investment fund platform built on Alephium. 

This repository contains both the smart contract logic (Ralph) and the React frontend. We have provided automated scripts to make reviewing our project as easy as possible.

## Quick Start (One-Click Run)

To compile the smart contracts, generate the artifacts, and start the UI automatically:

**For Windows:**
Double-click on `run.bat` or run in terminal:
```cmd
run.bat
```

**For Mac/Linux:**
Double-click on `run.sh` or run in terminal:
```cmd
run.sh
```

## UI Walkthrough & Testing Guide

To test the platform, use the provided demo accounts. 

**Crucial Requirement:** You must connect your Alephium wallet extension using a **Group 0** address to interact with the smart contracts.

### Admin Portal
**Login:** `admin@alephqis.com` (Password: any)

* **Connect Wallet:** Link your Group 0 Alephium wallet.
* **Create Fund:** Deploys a new `QISFund` smart contract on the blockchain and mints the initial token supply.
* **Update NAV:** Modifies the fund's Net Asset Value (Price) by signing an on-chain transaction for total transparency.
* **Client Management:** Monitor total AUM and track individual client portfolios.

### Client Dashboard
**Login:** `client@alephqis.com` (Password: any)


* **Connect Wallet:** Link your Group 0 wallet to enable trading.
* **Live Portfolio:** Track investments with real-time P&L calculations synced directly with the on-chain NAV.
* **Trade (Buy/Sell):** Buy shares (mints tokens to your wallet) or Sell shares (burns tokens from your wallet). All trades require transaction signatures.
* **On-Chain Verification:** Look for the live "Verified On-Chain" badge confirming the fund is backed by a deployed smart contract.


## Repository Architecture

This project is structured as a monorepo to separate the blockchain logic from the user interface while keeping the setup seamless.



```text
QIS_Hackathon/
├── aleph-qis/              # Blockchain backend
│   ├── contracts/          # Smart contracts written in Ralph (QISFund.ral)
│   ├── scripts/            # Deployment scripts
│   ├── alephium.config.ts  # Network and node configuration
│   └── artifacts/          # Generated ABIs and TS classes after compilation
│
├── alephqis-ui/            # Web3 Frontend (React)
│   ├── src/components/     # UI components (Dashboards, Dialogs)
│   ├── src/artifacts/      # Copied from backend to enable on-chain interactions
│   └── src/utils/          # API integrations and helpers
│
├── run.bat                 # Automated startup script (Windows)
└── run.sh                  # Automated startup script (Mac/Linux)
