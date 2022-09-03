const db = require("../../models/index");
const ldap = require("ldapjs");
const ldapClient = require("../../middlewares/ldap/ldapConfig");
const jwtConfig = require("../../middlewares/jwt/jwtConfig");
const { Constant } = require("../../constant/Constant");
const { Strings } = require("../../constant/Strings");

const login = async (req, res) => {
    const { username, password } = req.body;
    let data = { ...Constant.RESULT_DATA };
    ldapClient.ldapClient.bind(
        `cn=${username},ou=users,ou=system`,
        password,
        function (err) {
            // error authentication ldap server
            if (err) {
                // error idUser or password incorrect
                if (err.name == new ldap.InvalidCredentialsError().name) {
                    data.status = Strings.StatusCodeAPI.UNAUTHORIZED;
                    data.message = Strings.Common.ERROR_PASSWORD_USERID;
                    res.status(Strings.StatusCodeAPI.UNAUTHORIZED).send(data);
                }
                //error not enough attribute
                else if (err.name == new ldap.UnwillingToPerformError().name) {
                    data.status = Strings.StatusCodeAPI.BAD_REQUEST;
                    data.message = Strings.Common.NOT_ENOUGH_DATA;
                    res.status(Strings.StatusCodeAPI.BAD_REQUEST).send(data);
                }
                //error other
                else {
                    data.status = Strings.StatusCodeAPI.SERVICE_UNAVAILABLE;
                    data.message = Strings.Common.SERVICE_UNAVAILABLE;
                    res.status(Strings.StatusCodeAPI.SERVICE_UNAVAILABLE).send(
                        data
                    );
                }
            }
            // get data user => token
            else {
                db.query(
                    "SELECT * FROM `user` WHERE CODE = ?",
                    [username],
                    (err, result) => {
                        if (err) {
                            data.status =
                                Strings.StatusCodeAPI.INTERNAL_SERVER_ERROR;
                            data.message = Strings.Common.ERROR;
                            res.status(
                                Strings.StatusCodeAPI.INTERNAL_SERVER_ERROR
                            ).send(data);
                        } else {
                            if (result.length > 0) {
                                data.status = Strings.StatusCodeAPI.OK;
                                data.message = Strings.Common.SUCCESS;
                                data.data = {
                                    access_token: process.env.ACCESS_TOKEN,
                                    token: jwtConfig.signToken(result[0].code),
                                };
                                res.status(Strings.StatusCodeAPI.OK).send(data);
                            }
                            // error result data user empty
                            else {
                                data.status =
                                    Strings.StatusCodeAPI.INTERNAL_SERVER_ERROR;
                                data.message = Strings.Common.ERROR_GET_DATA;
                                res.status(
                                    Strings.StatusCodeAPI.INTERNAL_SERVER_ERROR
                                ).send(data);
                            }
                        }
                    }
                );
            }
        }
    );
};

const login2 = (req, res) => {
    res.send(Constant.RESULT_DATA);
};

module.exports = {
    login,
    login2,
};
