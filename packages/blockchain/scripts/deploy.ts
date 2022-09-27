// // We require the Hardhat Runtime Environment explicitly here. This is optional
// // but useful for running the script in a standalone fashion through `node <script>`.
// //
// // When running the script with `npx hardhat run <script>` you'll find the Hardhat
// // Runtime Environment's members available in the global scope.
// //import { Settings } from "@king/contracts-typechain";
// import { ethers, upgrades } from "hardhat";

import { ethers, upgrades } from "hardhat";
import { deployContracts } from "../utils/utils";
import { saveDeployedAddress } from "../utils/utils";
// //

async function main() {
  const KingFactory = await ethers.getContractFactory("King");
  const king = await upgrades.deployProxy(KingFactory, [150], {
    kind: "uups",
  });
  await king.deployed();
  await saveDeployedAddress(king.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
