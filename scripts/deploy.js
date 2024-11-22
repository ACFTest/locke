const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  // Define the parameters for the deployment
  const initialOwner = deployer.address;
  const maxCapacitySupply = ethers.utils.parseUnits("1000000", 0); // 1,000,000 tokens as the maximum capacity
  const initialSupply = ethers.utils.parseUnits("500000", 0); // 500,000 tokens as the initial supply

  // Deploy the upgradeable proxy
  const Token = await ethers.getContractFactory("Token");
  console.log("Deploying Locke Token...");
  const token = await upgrades.deployProxy(
    Token,
    [initialOwner, maxCapacitySupply, initialSupply],
    { initializer: "initialize" }
  );

  await token.deployed();
  console.log("Locke Token deployed to:", token.address);

  // Save contract information for the frontend
  saveFrontendFiles(token.address);
}

function saveFrontendFiles(tokenAddress) {
  const contractsDir = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "contracts"
  );

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ Token: tokenAddress }, null, 2)
  );

  const TokenArtifact = artifacts.readArtifactSync("Token");
  fs.writeFileSync(
    path.join(contractsDir, "Token.json"),
    JSON.stringify(TokenArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
