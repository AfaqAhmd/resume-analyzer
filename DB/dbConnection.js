const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

async function dbCon() {

    try {
        const db = await mongoose

            .connect(`mongodb+srv://afaqahmed:International19000@cluster0.eak8wxl.mongodb.net/?retryWrites=true&w=majority`)

            .then(() => console.log("Database Connected"))
            .catch((err) => console.log(`connection failed ${err}`));

        mongoose.connection.on("connected", () =>

            console.log("DATABASE SUCCESSFULLY CONNECTED...!")
        );

        mongoose.connection.on("disconnected", () =>

            console.log("DATABASE CONNECTION TERMINATED...!")
        );

    } catch (err) {
        console.log(err, "here is an error");
    }
}

module.exports = dbCon;