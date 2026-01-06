import hre from "hardhat";
import { expect } from "chai";
import { DECIMALS, MINTING_AMOUNT } from "./constant";
import { MyToken, TinyBank } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TinyBank", () => {
  let signers: HardhatEthersSigner[];
  let myTokenC: MyToken;
  let tinyBankC: TinyBank;

  beforeEach(async () => {
    signers = await hre.ethers.getSigners();

    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
    ]);

    // TinyBank constructor가 (stakingToken, managers[3]) 형태라서 managers를 "고정 길이 3개 튜플"로 만들어서 같이 넘겨야 함
    const managers: [string, string, string] = [
      signers[1].address,
      signers[2].address,
      signers[3].address,
    ];

    tinyBankC = await hre.ethers.deployContract("TinyBank", [
      await myTokenC.getAddress(),
      managers,
    ]);

    await myTokenC.setManager(await tinyBankC.getAddress());
  });

  describe("Initialized state check", () => {
    it("should return totalStaked 0", async () => {
      expect(await tinyBankC.totalStaked()).equal(0);
    });

    it("should return staked 0 amount of signer0", async () => {
      const signer0 = signers[0];
      expect(await tinyBankC.staked(signer0.address)).equal(0);
    });
  });

  describe("Staking", () => {
    it("should return staked amount", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);

      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);

      expect(await tinyBankC.staked(signer0.address)).equal(stakingAmount);
      expect(await tinyBankC.totalStaked()).equal(stakingAmount);

      expect(await myTokenC.balanceOf(await tinyBankC.getAddress())).equal(
        await tinyBankC.totalStaked()
      );
    });
  });

  describe("Withdraw", () => {
    it("should return 0 staked after withdrawing total token", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);

      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);

      await tinyBankC.withdraw(stakingAmount);

      expect(await tinyBankC.staked(signer0.address)).equal(0);
      expect(await tinyBankC.totalStaked()).equal(0);

      expect(await myTokenC.balanceOf(await tinyBankC.getAddress())).equal(0);
    });
  });

  describe("reward", () => {
    it("should reward 1MT every blocks", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);

      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);

      const BLOCKS = 5;
      const transferAmount = hre.ethers.parseUnits("1", DECIMALS);

      for (let i = 0; i < BLOCKS; i++) {
        await myTokenC.transfer(transferAmount, signer0.address);
      }

      await tinyBankC.withdraw(stakingAmount);

      const expected = hre.ethers.parseUnits(
        (BigInt(BLOCKS) + MINTING_AMOUNT + 1n).toString(),
        DECIMALS
      );

      expect(await myTokenC.balanceOf(signer0.address)).equal(expected);
    });

    it("should revert when changing rewardPerBlock by hacker", async () => {
      const hacker = signers[4]; // managers에 안 들어간 애로
      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);

      await expect(
        tinyBankC.connect(hacker).setRewardPerBlock(rewardToChange)
      ).to.be.reverted;
    });
  });
});