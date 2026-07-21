import axios from "axios";
import FormData from "form-data";

const getTranslationClient = () => {
    return axios.create({
        baseURL: process.env.TRANSLATION_SERVICE_URL,
        timeout: 60000,
    });
};

/*
=========================================================
Translate Text
=========================================================
*/

export const translateText = async ({
    text,
    sourceLanguage,
    targetLanguage,
}) => {

    const translationClient = getTranslationClient();

    const response = await translationClient.post(
        "/api/translate",
        {
            text,
            sourceLanguage,
            targetLanguage,
        }
    );

    return response.data.data;
};

/*
=========================================================
Speech To Text
=========================================================
*/

export const speechToText = async (audioFile) => {

    const translationClient = getTranslationClient();

    const formData = new FormData();

    formData.append(
        "audio",
        audioFile.buffer,
        {
            filename: audioFile.originalname,
            contentType: audioFile.mimetype,
        }
    );

    const response = await translationClient.post(
        "/api/speech-to-text",
        formData,
        {
            headers: formData.getHeaders(),
        }
    );

    return response.data.data;
};