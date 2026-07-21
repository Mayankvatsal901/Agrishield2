import {
    translateText
} from "../providers/sarvam.provider.js";
import { speechToTextProvider } from "../providers/sarvam.provider.js";

export const translate = async ({

    text,

    sourceLanguage,

    targetLanguage,

}) => {

    return await translateText({

        text,

        sourceLanguage,

        targetLanguage,

    });

};





export const speechToText = async (audioFile) => {

    return await speechToTextProvider(audioFile);

};