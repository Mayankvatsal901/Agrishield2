import sharp from "sharp";

export const preprocessImage = async (imageBuffer) => {

    return await sharp(imageBuffer)

        .grayscale()

        .normalize()

        .sharpen()

        .resize({
            width: 1800,
            withoutEnlargement: false,
        })

        .toBuffer();

};