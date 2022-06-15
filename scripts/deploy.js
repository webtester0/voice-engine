const main = async () => {
  const vEngineContractFactory = await hre.ethers.getContractFactory(
    "VoiceEngine"
  );
  const vEngineContract = await vEngineContractFactory.deploy();
  await vEngineContract.deployed();

  console.log("Contract addr: ", vEngineContract.address);
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
