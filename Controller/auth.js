const jwt = require("jsonwebtoken");
const userschema = require("../DB/dbSchema");
const hashy = require('hashy');
const saltRounds = 10;


async function signUp(req, res) {
    try {

        const { firstName, lastName, email, password, role } = req.body;

        const checkEmail = await userschema.findOne({ email })
        console.log(checkEmail, 'line number 41');

        if (checkEmail) {

            return res.send({
                status: 505,
                message: "user already exists",
            })
        }


        hashy.hash(password, function (error, hash) {

            if (error) {
                return console.log(error);
            }

            const user = {

                firstName,
                lastName,
                email,
                password: hash,
                role,
            };

            const result = new userschema(user).save();

            res.send({

                result,
                status: 200,
                message: "signup successfully",
                user
            });


        });



    } catch (err) {

        res.send({

            err,
            status: 500,
            message: "sorry! server is not responding",

        });
    }
}


async function login(req, res) {

    try {

        const { email, password } = req.body;
        const user = await userschema.findOne({ email })

        // console.log(user.role, user);


        if (!user) {

            return res.status(404).send({

                message: "User not found",
            });
        }

        hashy.verify(password, user.password, function (error, success) {

            if (error) {

                console.error(error);

                return res.status(500).send({
                    message: "Error verifying password",
                });
            }

            if (success) {

                console.log(process.env.JWTSECRETKEY, "process.env.JWTSECRETKEY");

                let token = jwt.sign(
                    {
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                    },
                    process.env.JWTSECRETKEY,
                    { expiresIn: "1d" }
                )

                res.cookie("jwtToken", token, {

                    httpOnly: true,
                });

                return res.status(200).send({

                    token,
                    user,
                    status: 200,
                    message: "user successfully login!!!",
                })

            } else {

                return res.status(401).send({

                    message: "Invalid password"
                });
            }

        });


    }
    catch (err) {

        return res.status(500).send({

            message: "Internal server error",
            error: err.message,
        });
    }
};


async function home(req, res) {

    const user = req.user;
    console.log("Decoded user:", user);


    try {

        if (user.role === "admin") {

            return res.send({

                user,
                status: 200,
                message: "Welcome Admin",
            });

        } else if (user.role === "user") {

            return res.send({

                user,
                status: 200,
                message: "Welcome user",

            });
        }

    } catch (err) {

        res.send({

            err,
            status: 500,
            message: "sorry! server is not responding",
        });

    }
}

module.exports = { signUp, login, home }
