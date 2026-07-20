export const translateText = async ({

    text,

    sourceLanguage,

    targetLanguage,

}) => {

    return {

        translatedText:

            `[${targetLanguage}] ${text}`,

    };

};