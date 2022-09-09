const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const { ExtractJwt } = require("passport-jwt");
require('dotenv').config();

passport.use(
    new JwtStrategy(
        {
            jwtFromRequest:
                ExtractJwt.fromAuthHeaderAsBearerToken("Authorization"),
            secretOrKey: process.env.KEY_SERCET_TOKEN,
        },
        (payload, done) => {
            try {
            done(null, (user = payload));
            } catch (err) {
                done(err, false);
            }
        }
    )
);
