const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VoiceEngine", function () {
  let owner, addr1, addr2, addr3;
  const duration = 60;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const VoiceEngine = await ethers.getContractFactory("VoiceEngine", owner);
    voice = await VoiceEngine.deploy();
    await voice.deployed();
  });

  it("init by owner", async function () {
    const currentOwner = await voice.owner();
    expect(currentOwner).to.eq(owner.address);
  });

  async function getTimestamp(bn) {
    return (await ethers.provider.getBlock(bn)).timestamp;
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  describe("createVote", function () {
    it("vote should be created correctly", async function () {
      const newVoiting = await voice.createVote(
        0,
        [addr1.address, addr2.address, addr3.address],
        duration
      );

      const currentVote = await voice.votes(0);
      expect(currentVote.exist).to.eq(true);

      const ts = await getTimestamp(currentVote.blockNumber);
      expect(currentVote.endAt).to.eq(ts + duration);

      const allCandidates = await voice.getAllCandidates(0);
      await expect(newVoiting)
        .to.emit(voice, "VoteCreated")
        .withArgs(0, allCandidates, currentVote.endAt);

      await expect(
        voice.createVote(
          0,
          [addr1.address, addr2.address, addr3.address],
          duration
        )
      ).to.be.revertedWith("Vote with this index is existed");
    });

    it("vote should not be created by randomAcc", async function () {
      await expect(
        voice
          .connect(addr1)
          .createVote(
            0,
            [addr1.address, addr2.address, addr3.address],
            duration
          )
      ).to.be.revertedWith("You are not owner");
    });

    it("list of candidates should have 2 candidates at least", async function () {
      await expect(
        voice.createVote(0, [addr1.address], duration)
      ).to.be.revertedWith(
        "List of candidates have to contain at least 2 candidates"
      );
    });

    it("list of candidates should have unique candidates", async function () {
      await expect(
        voice.createVote(0, [addr1.address, addr1.address], duration)
      ).to.be.revertedWith("List of candidates has duplicates");
    });

    it("list of candidates shouldn't be empty", async function () {
      await expect(voice.createVote(0, [], duration)).to.be.revertedWith(
        "List of candidates are empty"
      );
    });
  });

  describe("makeVoting", function () {
    it("voter should make valid voice", async function () {
      const txn = await voice.createVote(
        0,
        [addr1.address, addr2.address, addr3.address],
        duration
      );

      await expect(voice.makeVoting(1, addr1.address)).to.be.revertedWith(
        "Vote with this index doesn't exist"
      );
    });

    it("voter should make voice on existed voting", async function () {
      await voice.createVote(
        0,
        [addr1.address, addr2.address, addr3.address],
        duration
      );

      await expect(voice.makeVoting(1, addr1.address)).to.be.revertedWith(
        "Vote with this index doesn't exist"
      );
    });

    it("voting should be in proccess", async function () {
      const txn = await voice.createVote(
        0,
        [addr1.address, addr2.address, addr3.address],
        1
      );

      this.timeout(3000);
      await delay(2000);

      await expect(voice.makeVoting(0, addr1.address)).to.be.revertedWith(
        "Vote is ended"
      );
    });

    it("voter should pay a valid price", async function () {
      await voice.createVote(
        0,
        [addr1.address, addr2.address, addr3.address],
        duration
      );

      await expect(
        voice.makeVoting(0, addr1.address, {
          value: ethers.utils.parseEther("0.0001"),
        })
      ).to.be.revertedWith("Not enough funds");
    });

    it("voter should voice for existed candidate", async function () {
      await voice.createVote(0, [addr1.address, addr2.address], duration);

      await expect(
        voice.makeVoting(0, addr3.address, {
          value: ethers.utils.parseEther("0.01"),
        })
      ).to.be.revertedWith("Candidate with this address doesn't register");
    });

    it("voter shouldn't voice for him/herself", async function () {
      await voice.createVote(0, [addr1.address, addr2.address], duration);

      await expect(
        voice.connect(addr1).makeVoting(0, addr1.address, {
          value: ethers.utils.parseEther("0.01"),
        })
      ).to.be.revertedWith("You can't vote for yourself");
    });

    it("voter shouldn't voice for him/herself", async function () {
      await voice.createVote(0, [addr1.address, addr2.address], duration);

      await expect(
        voice.connect(addr1).makeVoting(0, addr1.address, {
          value: ethers.utils.parseEther("0.01"),
        })
      ).to.be.revertedWith("You can't vote for yourself");
    });

    it("voter should receive refund if sents more than fee", async function () {
      await voice.createVote(0, [addr1.address, addr2.address], duration);

      const txn = await voice.connect(addr1).makeVoting(0, addr2.address, {
        value: ethers.utils.parseEther("1"),
      });

      await expect(() => txn).to.changeEtherBalances(
        [voice, addr1],
        [ethers.utils.parseEther("0.01"), `-${ethers.utils.parseEther("0.01")}`]
      );
    });

    it("voter should voice only one time at vote", async function () {
      await voice.createVote(
        0,
        [addr1.address, addr2.address, addr3.address],
        duration
      );

      await voice.connect(addr1).makeVoting(0, addr2.address, {
        value: ethers.utils.parseEther("0.01"),
      });

      await expect(
        voice.connect(addr1).makeVoting(0, addr3.address, {
          value: ethers.utils.parseEther("0.01"),
        })
      ).to.be.revertedWith("You can vote only one time");
    });

    it("votes should be counted correctly", async function () {
      await voice.createVote(
        0,
        [addr1.address, addr2.address, addr3.address],
        duration
      );

      const makeNewVoice = await voice.makeVoting(0, addr1.address, {
        value: ethers.utils.parseEther("0.01"),
      });

      await voice.connect(addr3).makeVoting(0, addr2.address, {
        value: ethers.utils.parseEther("0.01"),
      });

      await expect(makeNewVoice)
        .to.emit(voice, "NewVote")
        .withArgs(0, addr1.address);

      const currentVoiting = await voice.votes(0);
      expect(currentVoiting.winner).to.eq(addr1.address);
      expect(currentVoiting.maxVotes).to.eq(1);
      expect(currentVoiting.participantsCounter).to.eq(2);
    });
  });

  describe("taxWithdraw", function () {
    it("owner should withdraw only available funds", async function () {
      await voice.createVote(
        0,
        [addr1.address, addr2.address, addr3.address],
        duration
      );

      await voice.makeVoting(0, addr1.address, {
        value: ethers.utils.parseEther("0.01"),
      });

      await expect(
        voice.taxWithdraw(ethers.utils.parseEther("0.01"), owner.address)
      ).to.be.revertedWith("Not enough funds on available balance");

      await expect(
        await voice.taxWithdraw(ethers.utils.parseEther("0.001"), owner.address)
      ).to.changeEtherBalances(
        [voice, owner],
        [
          `-${ethers.utils.parseEther("0.001")}`,
          ethers.utils.parseEther("0.001"),
        ]
      );
    });
  });

  describe("finishVote", function () {
    it("Anyone can close voiting only if it not in progress and finished", async function () {
      await voice.createVote(
        0,
        [addr1.address, addr2.address, addr3.address],
        2
      );

      await voice.makeVoting(0, addr1.address, {
        value: ethers.utils.parseEther("0.01"),
      });

      this.timeout(2500);
      await delay(1000);

      await expect(voice.connect(addr1).finishVote(0)).to.be.revertedWith(
        "This voting is not finished"
      );

      await delay(1000);
      await voice.finishVote(0);

      const currentVote = await voice.votes(0);
      expect(currentVote.exist).to.eq(false);
    });

    it("Winner should get cerrect benefits", async function () {
      await voice.createVote(
        0,
        [addr1.address, addr2.address, addr3.address],
        2
      );

      await voice.makeVoting(0, addr1.address, {
        value: ethers.utils.parseEther("0.01"),
      });

      this.timeout(2500);
      await delay(2000);

      await expect(await voice.finishVote(0)).to.changeEtherBalances(
        [voice, addr1],
        [
          `-${ethers.utils.parseEther("0.009")}`,
          ethers.utils.parseEther("0.009"),
        ]
      );
    });
  });

  describe("getAllCandidates", function () {
    it("should return list of candidates", async function () {
      await voice.createVote(0, [addr1.address, addr2.address], 2);
      const cdts = await voice.getAllCandidates(0);
      expect(cdts).deep.to.eq([addr1.address, addr2.address]);
    });
  });

  describe("getWinner", function () {
    it("should return winner address", async function () {
      await voice.createVote(0, [addr1.address, addr2.address], 2);
      await voice.makeVoting(0, addr1.address, {
        value: ethers.utils.parseEther("0.01"),
      });
      const getWinnerFromVoiting = await voice.votes(0);
      const winner = await voice.getWinner(0);
      expect(getWinnerFromVoiting.winner).to.eq(winner);
    });
  });

  describe("getWinnerBenefits", function () {
    it("should return valid winner benefits", async function () {
      await voice.createVote(0, [addr1.address, addr2.address], 2);
      await voice.makeVoting(0, addr1.address, {
        value: ethers.utils.parseEther("0.01"),
      });
      const winnerBenefits = await voice.getWinnerBenefits(0);
      expect(winnerBenefits).to.eq(ethers.utils.parseEther("0.009"));
    });
  });

  describe("getNumberOfParticipants", function () {
    it("should return number of participants", async function () {
      await voice.createVote(0, [addr1.address, addr2.address], 2);
      await voice.makeVoting(0, addr1.address, {
        value: ethers.utils.parseEther("0.01"),
      });
      const nOfPcts = await voice.getNumberOfParticipants(0);
      expect(nOfPcts).to.eq(1);
    });
  });

  describe("getContractBalance", function () {
    it("should return current contract balance", async function () {
      await voice.createVote(0, [addr1.address, addr2.address], 2);
      await voice.makeVoting(0, addr1.address, {
        value: ethers.utils.parseEther("0.01"),
      });
      const contractBalance = await voice.getContractBalance();
      expect(contractBalance).to.eq(ethers.utils.parseEther("0.01"));
    });
  });

  describe("getCandidateVoices", function () {
    it("should return candidate voices", async function () {
      await voice.createVote(0, [addr1.address, addr2.address], 2);
      await voice.makeVoting(0, addr1.address, {
        value: ethers.utils.parseEther("0.01"),
      });
      const voices = await voice.getCandidateVoices(0, addr1.address);
      expect(parseInt(voices.toString())).to.eq(1);
    });
  });
});
