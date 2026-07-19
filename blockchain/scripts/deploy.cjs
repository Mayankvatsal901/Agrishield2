const hre = require("hardhat");

async function main() {

    console.log("Step 1");

    const Contract = await hre.ethers.getContractFactory("AgrishieldBlockchain");

    console.log("Step 2");

    const contract = await Contract.deploy();

    console.log("Step 3");

    await contract.waitForDeployment();

    console.log("Step 4");

    console.log("Contract deployed at:", await contract.getAddress());

}

main().catch((error) => {

    console.error(error);

    process.exitCode = 1;

});