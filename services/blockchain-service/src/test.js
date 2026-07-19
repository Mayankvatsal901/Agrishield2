import {
    storeHashOnBlockchain,
    verifyHashOnBlockchain,
    getHashFromBlockchain
} from "./services/blockchain.service.js";

const main = async () => {

    const certificateNumber = "CERT-1001";

    const hash = "ABC123456789XYZ";

    // Store
    const result = await storeHashOnBlockchain(
        certificateNumber,
        hash
    );

    console.log(result);

    // Read
    const storedHash = await getHashFromBlockchain(
        certificateNumber
    );

    console.log("Stored Hash:");
    console.log(storedHash);

    // Verify
    const verified = await verifyHashOnBlockchain(
        certificateNumber,
        hash
    );

    console.log("Verified:");
    console.log(verified);

};

main();