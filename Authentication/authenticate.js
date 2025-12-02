const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

console.log("secret key", process.env.JWTSECRETKEY);

const authrization = async (req, res, next) => {

    const header = req.header("Authorization");
    console.log("here is a header", header);

    if (!header) {
        return res.send({
            status: 401,
            message: "headers are invalid",
        });
    }

    try {

        const token = header.split(" ")[1];

        jwt.verify(token, process.env.JWTSECRETKEY, (err, user) => {

            if (err) {
                return res.sendStatus(403); // Forbidden
            }

            req.user = user;
            console.log(req.user)

            next();

        });

    } catch (err) {

        res.send({
            
            status: 505,
            message: "user is not authorized",
        });
    }
};
module.exports = authrization;