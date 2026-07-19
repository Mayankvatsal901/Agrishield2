require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

console.log("RPC URL:", process.env.ETH_RPC_URL);
console.log("Private Key:", process.env.PRIVATE_KEY);

module.exports = {
    solidity: "0.8.24",

    networks: {
        sepolia: {
            url: process.env.ETH_RPC_URL,
            accounts: [process.env.PRIVATE_KEY],
        },
    },
};