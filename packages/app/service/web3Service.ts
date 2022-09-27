import { ethers } from "ethers";
import { getSession } from "next-auth/react";
import { getToken } from "next-auth/jwt";
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";
import Web3Modal from "web3modal";
import { King, KingABI, Settings } from "@king/contracts-typechain";
export class Web3Service {
  async getKingInfo() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const contract = new ethers.Contract(Settings.king, KingABI.abi, provider) as unknown as King;
    return contract.getGameMode();
  }
  async challenge() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    return await signer.signMessage("Welcome to Celts!");
  }
}
