import crypto from "crypto";

export const generateSHA256Hash = (buffer) => {

    return crypto
        .createHash("sha256")
        .update(buffer)
        .digest("hex");

};