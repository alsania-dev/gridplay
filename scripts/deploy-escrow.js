const hre = require("hardhat");

async function main() {
  console.log("Deploying GridPlayEscrow contract...");

  const GridPlayEscrow = await hre.ethers.getContractFactory("GridPlayEscrow");
  const escrow = await GridPlayEscrow.deploy();

  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log(`GridPlayEscrow deployed to: ${address}`);

  // Verify contract on Polygonscan (optional)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await escrow.deploymentTransaction().wait(5);

    console.log("Verifying contract...");
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
  }

  console.log("Deployment complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
