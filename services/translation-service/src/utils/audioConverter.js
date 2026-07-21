import ffmpeg from "fluent-ffmpeg";
import path from "path";

export const convertToWav = (inputPath) => {
  return new Promise((resolve, reject) => {
    const outputPath = inputPath.replace(
      path.extname(inputPath),
      ".wav"
    );

    ffmpeg(inputPath)
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec("pcm_s16le")
      .format("wav")
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .save(outputPath);
  });
};