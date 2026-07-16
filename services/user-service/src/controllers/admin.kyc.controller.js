

export const getAllKYC = async (req, res) => {

    try {

        const { status, page, limit } = req.query;

        const result = await adminKYCService.getAllKYC({

            status,

            page,

            limit,

        });

        return res.status(200).json({

            success: true,

            ...result,

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};


export const getKYCDetails = async (req, res) => {

    try {

        const kyc = await adminKYCService.getKYCDetails(
            req.params.userId
        );

        return res.status(200).json({

            success: true,

            data: kyc,

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

};
export const approveKYC = async (req, res) => {

    try {

        const kyc = await adminKYCService.approveKYC(

            req.params.userId,

            req.user.userId

        );

        return res.status(200).json({

            success: true,

            message: "KYC Approved Successfully.",

            data: kyc,

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

};

export const rejectKYC = async (req, res) => {

    try {

        const kyc = await adminKYCService.rejectKYC(

            req.params.userId,

            req.user.userId,

            req.body.reason

        );

        return res.status(200).json({

            success: true,

            message: "KYC Rejected Successfully.",

            data: kyc,

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

};
