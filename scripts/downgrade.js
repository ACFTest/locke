const { ethers, upgrades } = require("hardhat");
const path = require("path");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("Downgrading the contracts with the account:", deployerAddress);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Load the existing proxy address from the saved addresses file
  const contractsDir = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "contracts"
  );
  const addressesFilePath = path.join(contractsDir, "contract-address.json");

  if (!fs.existsSync(addressesFilePath)) {
    throw new Error(`Contract address file not found at ${addressesFilePath}`);
  }

  const addresses = JSON.parse(fs.readFileSync(addressesFilePath));
  if (!addresses.Token) {
    throw new Error("Token proxy address not found in contract address file.");
  }

  const proxyAddress = addresses.Token; // Use the Token proxy address

  // Downgrading the TokenV2 contract back to Token
  const Token = await ethers.getContractFactory("Token");
  console.log("Downgrading Locke Token from TokenV2 back to Token...");
  const downgradedToken = await upgrades.upgradeProxy(proxyAddress, Token);

  console.log(
    "Locke Token downgraded back to Token at:",
    downgradedToken.address
  );

  // Save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(downgradedToken);
}

function saveFrontendFiles(downgradedToken) {
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

  const addressesFilePath = path.join(contractsDir, "contract-address.json");
  let addresses = {};

  if (fs.existsSync(addressesFilePath)) {
    addresses = JSON.parse(fs.readFileSync(addressesFilePath));
  }

  addresses.Token = downgradedToken.address;

  fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, undefined, 2));

  const TokenArtifact = artifacts.readArtifactSync("Token");

  fs.writeFileSync(
    path.join(contractsDir, "Token.json"),
    JSON.stringify(TokenArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Downgrade failed:", error);
    process.exit(1);
  });
