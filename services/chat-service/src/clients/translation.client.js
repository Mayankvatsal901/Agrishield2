import axios from "axios";




export const translateText = async ({
    text,
    sourceLanguage,
    targetLanguage,
}) => {
    const translationClient = axios.create({
        baseURL: process.env.TRANSLATION_SERVICE_URL,
        timeout: 10000,
    });

    try {

        console.log("Calling:", process.env.TRANSLATION_SERVICE_URL);

        const response = await translationClient.post(
            "/api/translate",
            {
                text,
                sourceLanguage,
                targetLanguage,
            }
        );

        console.log(response.data);

        return response.data.data;

    } catch (error) {

        console.log(error.response?.data);
        console.log(error.message);

        throw error;
    }
};