export const generateCertificateNumber = () => {

    const year = new Date().getFullYear();

    const random = Date.now();

    return `AGR-${year}-${random}`;

};