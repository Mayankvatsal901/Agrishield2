async function main() {

    const AgrishieldBlockchain =
        await ethers.getContractFactory(
            "AgrishieldBlockchain"
        );

    const contract =
        await AgrishieldBlockchain.deploy();

    await contract.waitForDeployment();

    const address = await contract.getAddress();

    console.log("✅ Contract Deployed To:", address);

}

main().catch((error) => {

    console.error(error);

    process.exit(1);

});