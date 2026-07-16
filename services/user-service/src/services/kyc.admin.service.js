import KYC from "../models/KYC.js";

export const getAllKYC = async ({
    status,
    page = 1,
    limit = 10,
}) => {

    const filter = {};

    if (status) {
        filter.status = status;
    }

    const currentPage = Number(page);
    const pageSize = Number(limit);

    const total = await KYC.countDocuments(filter);

    const kycs = await KYC.find(filter)
        .select(
            "userId status lastSubmittedAt documents"
        )
        .sort({
            lastSubmittedAt: -1,
        })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize);

    return {

        data: kycs,

        pagination: {

            page: currentPage,

            limit: pageSize,

            total,

            totalPages: Math.ceil(total / pageSize),

        },

    };

};

export const getKYCDetails = async (userId) => {

    const kyc = await KYC.findOne({ userId });

    if (!kyc) {
        throw new Error("KYC not found.");
    }

    return kyc;
};

export const approveKYC = async (userId, adminId) => {

    const kyc = await KYC.findOne({ userId });

    if (!kyc) {
        throw new Error("KYC not found.");
    }

    if (kyc.status === "APPROVED") {
        throw new Error("KYC is already approved.");
    }

    kyc.status = "APPROVED";

    kyc.rejectionReason = "";

    kyc.verifiedBy = adminId;

    kyc.verifiedAt = new Date();

    await kyc.save();

    return kyc;

};



export const rejectKYC = async (
    userId,
    adminId,
    reason
) => {

    if (!reason || reason.trim() === "") {
        throw new Error("Rejection reason is required.");
    }

    const kyc = await KYC.findOne({ userId });

    if (!kyc) {
        throw new Error("KYC not found.");
    }

    if (kyc.status === "REJECTED") {
        throw new Error("KYC is already rejected.");
    }

    kyc.status = "REJECTED";

    kyc.rejectionReason = reason;

    kyc.verifiedBy = adminId;

    kyc.verifiedAt = new Date();

    await kyc.save();

    return kyc;

};

