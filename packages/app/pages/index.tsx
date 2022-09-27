import { ConnectButton, getDefaultWallets } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import Head from "next/head";
import { Header } from "../components/Header";
import styles from "../styles/Home.module.css";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { AppProps } from "next/app";
import { chain, configureChains, createClient, usePrepareContractWrite, WagmiConfig } from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { KingBoard } from "../components/KingBoard";
import { CONFIG } from "../utils/config";
import { ModalProvider } from "react-modal-hook";

const { chains, provider } = configureChains(
  [chain.goerli, chain.hardhat],
  [alchemyProvider({ apiKey: CONFIG.INFURA_ID, priority: 1 }), publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "King of Fools",
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

const Home: NextPage = () => {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <ModalProvider>
          <>
            <Header />
            <KingBoard></KingBoard>
          </>
        </ModalProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default Home;
