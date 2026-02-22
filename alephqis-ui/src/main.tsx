import { createRoot } from "react-dom/client";
import { AlephiumWalletProvider } from "@alephium/web3-react";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  // AJOUT CRUCIAL : addressGroup={0}
  <AlephiumWalletProvider theme="light" network="devnet" addressGroup={0}>
    <App />
  </AlephiumWalletProvider>
);