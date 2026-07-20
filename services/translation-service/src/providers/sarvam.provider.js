import { SarvamAIClient } from "sarvamai";

const client = new SarvamAIClient({
    apiSubscriptionKey: process.env.SARVAM_API_KEY,
});

const languageMap = {
    en: "en-IN",
    hi: "hi-IN",
    bn: "bn-IN",
    gu: "gu-IN",
    mr: "mr-IN",
    ta: "ta-IN",
    te: "te-IN",
    kn: "kn-IN",
    ml: "ml-IN",
    pa: "pa-IN",
};

export const translateText = async ({
    text,
    sourceLanguage,
    targetLanguage,
}) => {

    const response = await client.text.translate({

        input: text,

        source_language_code:
            languageMap[sourceLanguage] || "en-IN",

        target_language_code:
            languageMap[targetLanguage] || "hi-IN",

        model: "mayura:v1",

        numerals_format: "native",

        mode: "formal",

    });

    return {

        translatedText:
            response.translated_text,

    };

};