import "dotenv/config";

const { default: app } = await import("./app.js");

const PORT = process.env.PORT || 5011;

app.listen(PORT, () => {

    console.log(
        `🚀 Translation Service running on port ${PORT}`
    );

});