import axios from "axios";
console.log("hello")

const userClient = axios.create({

    baseURL: process.env.USER_SERVICE_URL,

    timeout: 5000,

});
console.log(userClient)

export default userClient;