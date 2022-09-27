//USDC(Ethereum Goerli): 0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
//USDC(Ethereum Main): 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { King, KingV2, MockUSDC } from "@king/contracts-typechain";
import {
  defaultRevertReasons,
  deployContracts,
  upgradeContract,
} from "../utils/utils";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { BigNumber } from "ethers";
describe("King of fools", () => {
  let accounts: SignerWithAddress[];
  let king: King;
  let usdc: MockUSDC;
  let owner: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress,
    user3: SignerWithAddress;
  beforeEach(async () => {
    ({ accounts, king, usdc } = await deployContracts(150));
    [owner, user1, user2, user3] = accounts;

    //Charge MockUSDC to user1, user2, user3
    await usdc.testMint(user1.address, 1000);
    await usdc.testMint(user2.address, 1000);
    await usdc.testMint(user3.address, 1000);
  });

  describe("Check contract status", () => {
    it("empty contract after deploy", async () => {
      // only Default Game mode(ETH)
      const [currentKing, price] = await king.getCurrentKing(
        ethers.constants.AddressZero
      );
      expect(currentKing).to.equal(ethers.constants.AddressZero);
      expect(price.toString()).to.equal("0");

      //Get only Default Game mode(ETH)
      const gameMode = await king.getGameMode();
      expect(gameMode.length).to.equal(1);
    });
  });

  describe("Check game logic", () => {
    describe("check game logic with ETH mode", async () => {
      it("Should become king when contract is empty", async () => {
        await expect(king.connect(user1).depositETH({ value: 1 }))
          .to.emit(king, "NewKing")
          .withArgs(ethers.constants.AddressZero, user1.address, 1);
      });
      it("Should become king with bigger price than previous king's", async () => {
        //Become king when contract is empty
        await expect(king.connect(user1).depositETH({ value: 10 }))
          .to.emit(king, "NewKing")
          .withArgs(ethers.constants.AddressZero, user1.address, 10);

        const oldBalanceOfUser1 = await ethers.provider.getBalance(
          user1.address
        );
        //Become king with defeating a previous king.
        await expect(king.connect(user2).depositETH({ value: 15 }))
          .to.emit(king, "NewKing")
          .withArgs(ethers.constants.AddressZero, user2.address, 15);
        const currentBalanceOfUser1 = await ethers.provider.getBalance(
          user1.address
        );
        expect(
          currentBalanceOfUser1.sub(oldBalanceOfUser1).toString()
        ).to.equal("15");
      });
      it("Should reject to become king with lower price than previous king's", async () => {
        //Become king when contract is empty
        await expect(king.connect(user1).depositETH({ value: 10 }))
          .to.emit(king, "NewKing")
          .withArgs(ethers.constants.AddressZero, user1.address, 10);

        //Become king with defeating a previous king.
        await expect(
          king.connect(user2).depositETH({ value: 8 })
        ).to.revertedWith(
          `${defaultRevertReasons.prefix.king} ${defaultRevertReasons.msg.notEnoughFund}`
        );
      });
      it("Should reject to become king with same address(ETH)", async () => {
        //Become king when contract is empty
        await expect(king.connect(user1).depositETH({ value: 10 }))
          .to.emit(king, "NewKing")
          .withArgs(ethers.constants.AddressZero, user1.address, 10);

        //Become king with defeating a previous king.
        await expect(
          king.connect(user1).depositETH({ value: 8 })
        ).to.revertedWith(
          `${defaultRevertReasons.prefix.king} ${defaultRevertReasons.msg.repeatedKing}`
        );
      });
    });

    describe("Check game logic with ERC20 token mode", async () => {
      it("should become king when contract is empty", async () => {
        await usdc.connect(user1).approve(king.address, 1);
        await expect(king.connect(user1).depositERC20(usdc.address, 1))
          .to.emit(king, "NewKing")
          .withArgs(usdc.address, user1.address, 1);
      });
      it("should become king with bigger price than previous king's", async () => {
        await usdc.connect(user1).approve(king.address, 10);
        //Become king when contract is empty
        await expect(king.connect(user1).depositERC20(usdc.address, 10))
          .to.emit(king, "NewKing")
          .withArgs(usdc.address, user1.address, 10);

        const oldBalanceOfUser1 = await usdc.balanceOf(user1.address);
        //Become king with defeating a previous king.
        await usdc.connect(user2).approve(king.address, 15);
        await expect(king.connect(user2).depositERC20(usdc.address, 15))
          .to.emit(king, "NewKing")
          .withArgs(usdc.address, user2.address, 15);
        const currentBalanceOfUser1 = await usdc.balanceOf(user1.address);
        expect(
          currentBalanceOfUser1.sub(oldBalanceOfUser1).toString()
        ).to.equal("15");
      });
      it("should reject to become king with lower price than previous king's", async () => {
        //Become king when contract is empty
        await usdc.connect(user1).approve(king.address, 10);
        await expect(king.connect(user1).depositERC20(usdc.address, 10))
          .to.emit(king, "NewKing")
          .withArgs(usdc.address, user1.address, 10);

        //Become king with defeating a previous king.
        await usdc.connect(user2).approve(king.address, 8);
        await expect(
          king.connect(user2).depositERC20(usdc.address, 8)
        ).to.revertedWith(
          `${defaultRevertReasons.prefix.king} ${defaultRevertReasons.msg.notEnoughFund}`
        );
      });

      it("should reject to become king with same address(USDC)", async () => {
        //Become king when contract is empty
        await usdc.connect(user1).approve(king.address, 10);
        await expect(king.connect(user1).depositERC20(usdc.address, 10))
          .to.emit(king, "NewKing")
          .withArgs(usdc.address, user1.address, 10);

        //Become king with defeating a previous king.
        await usdc.connect(user1).approve(king.address, 8);
        await expect(
          king.connect(user1).depositERC20(usdc.address, 8)
        ).to.revertedWith(
          `${defaultRevertReasons.prefix.king} ${defaultRevertReasons.msg.repeatedKing}`
        );
      });
    });
  });

  describe("Governance", () => {
    describe("Emergency Pause by Admin", async () => {
      it("Should pause contract by admin", async () => {
        await king.pause();
        await expect(
          king.connect(user1).depositETH({ value: 1 })
        ).to.revertedWith(`${defaultRevertReasons.paused}`);

        await expect(
          king.connect(user1).depositERC20(usdc.address, 20)
        ).to.revertedWith(`${defaultRevertReasons.paused}`);
      });

      it("Should unpause contract by admin", async () => {
        await king.pause();
        await expect(
          king.connect(user1).depositETH({ value: 1 })
        ).to.revertedWith(`${defaultRevertReasons.paused}`);

        await expect(
          king.connect(user1).depositERC20(usdc.address, 20)
        ).to.revertedWith(`${defaultRevertReasons.paused}`);

        await king.unpause();
        await expect(king.connect(user1).depositETH({ value: 1 }))
          .to.emit(king, "NewKing")
          .withArgs(ethers.constants.AddressZero, user1.address, 1);
      });

      it("Should reject to pause contract by non-admin", async () => {
        await expect(king.connect(user1).pause()).to.revertedWith(
          `${defaultRevertReasons.prefix.ownable} ${defaultRevertReasons.msg.accessDenied}`
        );
      });

      it("Should reject to unpause contract by non-admin", async () => {
        await king.pause();
        await expect(
          king.connect(user1).depositETH({ value: 1 })
        ).to.revertedWith(`${defaultRevertReasons.paused}`);

        await expect(
          king.connect(user1).depositERC20(usdc.address, 20)
        ).to.revertedWith(`${defaultRevertReasons.paused}`);

        await expect(king.connect(user1).unpause()).to.revertedWith(
          `${defaultRevertReasons.prefix.ownable} ${defaultRevertReasons.msg.accessDenied}`
        );
      });
    });

    describe("Upgrade Contract", async () => {
      let kingV2: KingV2;
      beforeEach(async () => {
        kingV2 = (await upgradeContract(king, "KingV2")) as KingV2;
      });
      it("Should update defeat ratio by admin", async () => {
        await expect(kingV2.connect(owner).updateDefeatRatio(300))
          .to.emit(kingV2, "UpdateDefeatRatio")
          .withArgs(owner.address, 300);
      });
      it("Should reject to update defeat ratio by none-admin", async () => {
        await expect(
          kingV2.connect(user2).updateDefeatRatio(300)
        ).to.revertedWith(`${defaultRevertReasons.noPermission}`);
      });
    });
  });
});
