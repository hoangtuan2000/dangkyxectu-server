const JWT = require("jsonwebtoken");
require('dotenv').config();

const signToken = (userID) => {
    return JWT.sign(
        {
            iss: "HeThongDangKyXeCTU",
            sub: userID ? userID : null,
            iat: new Date().getTime(),
            exp: new Date().setDate(new Date().getDate() + 3),
            // exp: Math.floor(Date.now() / 1000) + (40),
        },
        process.env.KEY_SERCET_TOKEN
    );
}

module.exports = {
    signToken
}