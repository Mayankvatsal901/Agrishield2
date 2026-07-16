import Tesseract from "tesseract.js";

export const extractText = async (imageBuffer) => {

    try {

        const {
            data,
        } = await Tesseract.recognize(

            imageBuffer,

            "eng+hin",

            {

                logger: (m) => {

                    if (m.status === "recognizing text") {

                        console.log(
                            `OCR Progress : ${Math.round(m.progress * 100)}%`
                        );

                    }

                },

            }

        );

        // Clean OCR text
        let cleanedText = data.text

            .replace(/\r/g, "")

            .replace(/[|]/g, "I")

            .replace(/[“”]/g, '"')

            .replace(/[‘’]/g, "'")

            .replace(/\t/g, " ")

            .replace(/[ ]{2,}/g, " ")

            .replace(/\n{2,}/g, "\n")

            .trim();
            console.log("========== RAW OCR ==========");
            console.log(cleanedText);
            console.log("=============================");

        return {

            text: cleanedText,

            confidence: Number(
                data.confidence.toFixed(2)
            ),

        };

    } catch (error) {

        console.error(error);

        throw new Error("OCR Extraction Failed.");

    }

};