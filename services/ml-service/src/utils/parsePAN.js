export const parsePAN = (text) => {

    const result = {

        name: "",
        fatherName: "",
        panNumber: "",
        dob: "",

    };

    const lines = text

        .split("\n")

        .map(line => line.trim())

        .filter(line => line.length > 0);

    // -----------------------
    // PAN Number
    // -----------------------

    const panMatch = text.match(/[A-Z]{5}[0-9]{4}[A-Z]/);

    if (panMatch)
        result.panNumber = panMatch[0];

    // -----------------------
    // DOB
    // -----------------------

    const dobMatch = text.match(/\d{2}\/\d{2}\/\d{4}/);

    if (dobMatch)
        result.dob = dobMatch[0];

    // -----------------------
    // Ignore Words
    // -----------------------

    const ignore = [

        "government",
        "india",
        "income",
        "department",
        "permanent",
        "account",
        "number",
        "card",
        "signature",

        "भारत",
        "सरकार",
        "आयकर",
        "विभाग",

    ];

    // -----------------------
    // Find Name
    // -----------------------

    const panIndex = lines.findIndex(line =>
        line.includes(result.panNumber)
    );

    if (panIndex !== -1) {

        for (let i = panIndex + 1; i < lines.length; i++) {

            const line = lines[i];

            if (ignore.some(word =>
                line.toLowerCase().includes(word.toLowerCase())
            ))
                continue;

            if (/^[A-Z ]+$/.test(line) ||
                /^[A-Z][a-z]+ [A-Z][a-z]+/.test(line)) {

                result.name = line;

                break;

            }

        }

    }

    // -----------------------
    // Father's Name
    // -----------------------

    const fatherIndex = lines.findIndex(line =>
        line.toLowerCase().includes("father")
    );

    if (fatherIndex !== -1) {

        for (let i = fatherIndex + 1; i < lines.length; i++) {

            const line = lines[i];

            if (line.length < 3)
                continue;

            if (ignore.some(word =>
                line.toLowerCase().includes(word.toLowerCase())
            ))
                continue;

            result.fatherName = line;

            break;

        }

    }

    return result;

};