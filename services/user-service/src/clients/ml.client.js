import axios from "axios";

export const extractKYC = async (documents) => {

    try {

        const response = await axios.post(

            `${process.env.ML_SERVICE_URL}/api/ocr/kyc`,

            {
                documents,
            }

        );

        return response.data.data;

    } catch (error) {

        if (error.response) {
            throw new Error(error.response.data.message);
        }

        throw new Error("Unable to connect to ML Service.");

    }

};