import axios from "axios";

export const checkFarmerEligibility = async (token) => {

    try {

        const response = await axios.get(

            `${process.env.USER_SERVICE_URL}/api/internal/farmer/eligibility`,

            {

                headers: {

                    Authorization: token,

                },

            }

        );

        return response.data.data;

    } catch (error) {

        if (error.response) {

            throw new Error(error.response.data.message);

        }

        throw new Error("Unable to connect to User Service.");

    }

};