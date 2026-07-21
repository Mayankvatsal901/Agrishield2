import { SarvamAIClient } from "sarvamai";
import fs from "node:fs";
import { convertToWav } from "../utils/audioConverter.js";

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
export const speechToTextProvider = async (audioFile) => {
    console.log({
        originalname: audioFile.originalname,
        mimetype: audioFile.mimetype,
        size: audioFile.size,
    });

    try {
        const wavPath = await convertToWav(audioFile.path);

        const response = await client.speechToText.transcribe({

            file: fs.createReadStream(wavPath),

            model: "saaras:v3",

            language_code: "en-IN",

            mode: "transcribe",

            sample_rate: 16000,

        });

        return {

            text: response.transcript,

        };

    } finally {

        fs.unlink(audioFile.path, () => {});

    }

};
