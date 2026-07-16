import axios from "axios";

export const downloadImage = async (imageUrl) => {

    try {

        const response = await axios.get(imageUrl, {
            responseType: "arraybuffer",
        });

        return Buffer.from(response.data);

    } catch (error) {

        throw new Error("Failed to download image.");

    }

};