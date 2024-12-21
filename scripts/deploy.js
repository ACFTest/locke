const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  // Display the current balance of the deployer
  const balance = await deployer.getBalance();
  console.log(
    "Deployer's current balance:",
    ethers.utils.formatEther(balance),
    "ETH"
  );

  // Deploy the Token contract
  console.log("Deploying Token contract...");
  const Token = await ethers.getContractFactory("Token");
  const token = await upgrades.deployProxy(Token, [deployer.address], {
    initializer: "initialize",
  });
  await token.deployed();
  console.log("Token contract deployed to:", token.address);

  console.log("Deployment completed successfully!");
  console.log({
    token: token.address,
    deployer: deployer.address,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying contracts:", error);
    process.exit(1);
  });
