const { task } = require("hardhat/config");
const VoiceEngineArtifact = require("../artifacts/contracts/VoiceEngine.sol/VoiceEngine.json");
require("dotenv").config();
const VoiceEngineAddress = process.env.CONTRACT_ADDRESS;

task("createVote", "Create new voiting")
  .addParam("index", "Index of voting")
  .addParam("candidates", "Candidates addresses")
  .addOptionalParam(
    "duration",
    "By default duration == 3 days, but could be config through this param"
  )
  .setAction(async (taskArgs, { ethers }) => {
    const [owner] = await ethers.getSigners();
    const { index, duration = 0 } = taskArgs;
    const candidates = taskArgs.candidates.split(",");

    const voice = new ethers.Contract(
      VoiceEngineAddress,
      VoiceEngineArtifact.abi,
      owner
    );

    try {
      if (!candidates.length) {
        throw new SyntaxError("List of candidates is empty");
      }
      const newVoiting = await voice.createVote(index, candidates, duration);
      await newVoiting.wait();
      const currentCandidates = await voice.getAllCandidates(index);
      const currentVote = await voice.votes(index);
      const date = new Date(currentVote.endAt * 1000);

      console.log(`
      New Voiting has been created!
      This Voiting endAt: ${date}
      List of candidates: 
      ${currentCandidates}
      `);
    } catch (e) {
      if (e.name == "SyntaxError") {
        console.log(e.message);
      } else {
        console.log(e);
      }
    }
  });

task("makeVoting", "Making a vote")
  .addParam("index", "Index of voting")
  .addParam("candidate", "Choosen candidate address")
  .setAction(async (taskArgs, { ethers }) => {
    const [owner] = await ethers.getSigners();
    const { index, candidate } = taskArgs;

    const voice = new ethers.Contract(
      VoiceEngineAddress,
      VoiceEngineArtifact.abi,
      owner
    );

    try {
      const newVote = await voice.makeVoting(index, candidate, {
        value: ethers.utils.parseEther("0.01"),
      });
      await newVote.wait();

      const voices = await voice.getCandidateVoices(index, candidate);
      const winner = await voice.getWinner(index);

      console.log(`
      Your vote has successfully accept for candidate ${candidate}
      ${candidate} has ${voices} voice/s.

      Winner of current Voiting: ${winner}
      `);
    } catch (e) {
      console.log(e);
    }
  });

task("taxWithdraw", "Tax withdraw")
  .addParam("amount", "Amount of withdraw funds")
  .addParam("addr", "Address of funds receive")
  .setAction(async (taskArgs, { ethers }) => {
    const [owner] = await ethers.getSigners();
    const { amount, addr } = taskArgs;

    const voice = new ethers.Contract(
      VoiceEngineAddress,
      VoiceEngineArtifact.abi,
      owner
    );

    try {
      const balance = await voice.getContractBalance();
      const txn = await voice.taxWithdraw(
        ethers.utils.parseEther(amount),
        addr
      );
      await txn.wait();

      console.log(`
      Your vote has successfully withdraw ${amount} to ${addr}
      Current contract balance: ${balance.toString()}
      `);
    } catch (e) {
      console.log(e);
    }
  });

task("finishVote", "Finish the voiting")
  .addParam("index", "Index of Voiting")
  .setAction(async (taskArgs, { ethers }) => {
    const [owner] = await ethers.getSigners();
    const { index } = taskArgs;

    const voice = new ethers.Contract(
      VoiceEngineAddress,
      VoiceEngineArtifact.abi,
      owner
    );

    try {
      const benefits = await voice.getWinnerBenefits(index);
      const winner = await voice.getWinner(index);
      const winnerVoices = await voice.getCandidateVoices(index, winner);

      console.log(`
      You have successfully finished the voiting #${index}
      The winner of voiting #${index} is ${winner} with voice/s ${winnerVoices}
      Winner's benefits ${benefits}
      `);
    } catch (e) {
      console.log(e);
    }
  });
