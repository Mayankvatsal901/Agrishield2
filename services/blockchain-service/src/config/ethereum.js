import { ethers } from "ethers";
import dotenv from "dotenv";

import abi from "./abi/AgrishieldBlockchainABI.json" with { type: "json" };

dotenv.config();
console.log(process.env.ETH_RPC_URL);
console.log(process.env.PRIVATE_KEY);
console.log(process.env.CONTRACT_ADDRESS);

const provider = new ethers.JsonRpcProvider(
    process.env.ETH_RPC_URL
);

const wallet = new ethers.Wallet(
    process.env.PRIVATE_KEY,
    provider
);

const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    abi,
    wallet
);

export {
    provider,
    wallet,
    contract
};