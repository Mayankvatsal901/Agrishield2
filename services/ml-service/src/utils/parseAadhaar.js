export const parseAadhaar = (text) => {

    const result = {
        name: "",
        dob: "",
        gender: "",
        aadhaarNumber: "",
    };

    const lines = text
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);

    // -----------------------------
    // Aadhaar Number
    // -----------------------------

    const aadhaarMatch = text.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);

    if (aadhaarMatch) {
        result.aadhaarNumber = aadhaarMatch[0];
    }

    // -----------------------------
    // DOB
    // -----------------------------

    const dobMatch = text.match(/\b\d{2}[\/-]\d{2}[\/-]\d{4}\b/);

    if (dobMatch) {
        result.dob = dobMatch[0];
    }

    // -----------------------------
    // Gender
    // -----------------------------

    const genderMatch = text.match(/\b(MALE|FEMALE|Male|Female|OTHER|Other)\b/i);

    if (genderMatch) {
        result.gender = genderMatch[0].toUpperCase();
    }

    // -----------------------------
    // Ignore List
    // -----------------------------

    const ignore = [

        "government",
        "india",
        "authority",
        "unique",
        "identification",
        "aadhaar",
        "address",
        "download",
        "proof",
        "citizenship",
        "authentication",
        "xml",
        "qr",
        "male",
        "female",
        "dob",
        "issued",
        "uidai",
        "www",

        "भारत",
        "सरकार",
        "आधार",
        "पहचान",
        "प्रमाण",

    ];

    // -----------------------------
    // Candidate Scoring
    // -----------------------------

    const candidates = [];

    lines.forEach((line, index) => {

        let score = 0;

        if (line.length < 3)
            return;

        if (/\d/.test(line))
            score -= 30;

        if (!/^[A-Za-z ]+$/.test(line))
            score -= 50;

        if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(line))
            score += 60;

        if (/^[A-Z ]+$/.test(line))
            score -= 10;

        ignore.forEach(word => {

            if (line.toLowerCase().includes(word.toLowerCase()))
                score -= 100;

        });

        const dobIndex = lines.findIndex(l =>
            l.includes(result.dob)
        );

        if (dobIndex !== -1 && index < dobIndex)
            score += 20;

        candidates.push({
            line,
            score,
        });

    });

    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length > 0)
        result.name = candidates[0].line;

    return result;

};