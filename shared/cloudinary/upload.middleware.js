import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

import cloudinary from "./cloudinary.js";

// Build a Cloudinary-safe name from the uploaded file's name:
// drop the extension, keep only letters/numbers, join the rest with "-".
// (Names like "aadhaar front .jpg" used to end in a space, which Cloudinary rejects.)
const safeName = (originalname = "") => {
    const base = originalname.replace(/\.[^.]+$/, "");
    const cleaned = base
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60)
        .toLowerCase();
    return cleaned || "file";
};

const storage = new CloudinaryStorage({
    cloudinary,

    params: async (req, file) => ({
        folder: "Agrishield",

        allowed_formats: ["jpg", "jpeg", "png", "webp"],

        public_id: `${Date.now()}-${safeName(file.originalname)}`,
    }),
});

const upload = multer({
    storage,
});

export default upload;
