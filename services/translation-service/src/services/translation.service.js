import {
    translateText
} from "../providers/sarvam.provider.js";

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