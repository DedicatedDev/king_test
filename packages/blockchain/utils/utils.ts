import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
} from "fs";

import { ethers, upgrades } from "hardhat";
import { King, MockUSDC } from "@king/contracts-typechain";
import { BaseContract, Contract } from "ethers";
import { UpgradeProxyOptions } from "@openzeppelin/hardhat-upgrades/dist/utils";
import { expect } from "chai";
export const saveDeployedAddress = async (king: string) => {
  appendFileSync("./.env", `\nAPP_ADDRESS=${king}`);
  const settingInfo = {
    king: king,
  };
  const settingsPath = "../contracts-typechain/settings";
  const json = JSON.stringify(settingInfo);
  writeFileSync(`${settingsPath}/settings.json`, json, "utf-8");
};

export async function deployContracts(ratio: number) {
  const accounts = await ethers.getSigners();
  const mockUSDCFactory = await ethers.getContractFactory("MockUSDC");
  const usdc = (await mockUSDCFactory.deploy("USDC", "USDC")) as MockUSDC;

  const KingFactory = await ethers.getContractFactory("King");
  const king = (await upgrades.deployProxy(KingFactory, [ratio], {
    kind: "uups",
  })) as King;
  await king.deployed();
  return { accounts, king, usdc };
}

export const upgradeContract: (
  contract: BaseContract,
  name: string,
  option?: UpgradeProxyOptions
) => Promise<Contract> = async (contract, name, option) => {
  const contractFactory = await ethers.getContractFactory(name);
  const upgradedContract = await upgrades.upgradeProxy(
    contract,
    contractFactory,
    option
  );
  expect(upgradedContract.address).to.equal(contract.address);
  return upgradedContract;
};

export const defaultRevertReasons = {
  paused: "Pausable: paused",
  noPermission: "OwnablePausable: access denied",
  prefix: {
    king: "King:",
    ownable: "OwnablePausable:",
  },
  msg: {
    notEnoughFund: "Not enough fund!",
    repeatedKing: "You are already king!",
    accessDenied: "access denied",
  },
};
