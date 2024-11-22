const { ethers, upgrades } = require("hardhat");
const path = require("path");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("Upgrading the contracts with the account:", deployerAddress);
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

  // Upgrading the Token contract to TokenV2
  const TokenV2 = await ethers.getContractFactory("TokenV2");
  console.log("Upgrading Locke Token to TokenV2...");
  const upgradedToken = await upgrades.upgradeProxy(proxyAddress, TokenV2);

  console.log("Locke Token upgraded to TokenV2 at:", upgradedToken.address);

  // Optionally call setVersion if available
  try {
    const tx = await upgradedToken.setVersion();
    await tx.wait();
    console.log("Version update event emitted.");
  } catch (err) {
    console.log("setVersion function is not available or failed:", err.message);
  }

  // Save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(upgradedToken);
}

function saveFrontendFiles(upgradedToken) {
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

  addresses.Token = upgradedToken.address;

  fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, undefined, 2));

  const TokenV2Artifact = artifacts.readArtifactSync("TokenV2");

  fs.writeFileSync(
    path.join(contractsDir, "TokenV2.json"),
    JSON.stringify(TokenV2Artifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Upgrade failed:", error);
    process.exit(1);
  });
