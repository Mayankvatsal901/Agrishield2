import axios from "axios";

export const downloadPdf = async (pdfUrl) => {

    const response = await axios.get(pdfUrl, {
        responseType: "arraybuffer"
    });

    return Buffer.from(response.data);

};