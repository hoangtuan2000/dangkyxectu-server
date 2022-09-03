const db = require("../../models/index");
const ldap = require("ldapjs");
const ldapClient = require("../../middlewares/ldap/ldapConfig");
const jwtConfig = require("../../middlewares/jwt/jwtConfig");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");

const login = async (req, res) => {
    const { code, password } = req.body;
    let data = { ...Constants.ResultData };
    ldapClient.ldapClient.bind(
        `cn=${code},ou=users,ou=system`,
        password,
        function (err) {
            // error authentication ldap server
            if (err) {
                // error idUser or password incorrect
                if (err.name == new ldap.InvalidCredentialsError().name) {
                    data.status = Constants.ApiCode.UNAUTHORIZED;
                    data.message = Strings.Common.ERROR_PASSWORD_USERID;
                    res.send(data);
                }
                //error not enough attribute
                else if (err.name == new ldap.UnwillingToPerformError().name) {
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.NOT_ENOUGH_DATA;
                    res.send(data);
                }
                //error other
                else {
                    data.status = Constants.ApiCode.SERVICE_UNAVAILABLE;
                    data.message = Strings.Common.SERVICE_UNAVAILABLE;
                    res.send(data);
                }
            }
            // get data user => token
            else {
                db.query(
                    "SELECT * FROM `user` WHERE CODE = ?",
                    [code],
                    (err, result) => {
                        //error select data
                        if (err) {
                            data.status =
                                Constants.ApiCode.INTERNAL_SERVER_ERROR;
                            data.message = Strings.Common.ERROR;
                            res.send(data);
                        } else {
                            if (result.length > 0) {
                                data.status = Constants.ApiCode.OK;
                                data.message = Strings.Common.SUCCESS;
                                data.data = {
                                    access_token: process.env.ACCESS_TOKEN,
                                    token: jwtConfig.signToken(result[0].code),
                                };
                                res.send(data);
                            }
                            // error result data user empty
                            else {
                                data.status =
                                    Constants.ApiCode.INTERNAL_SERVER_ERROR;
                                data.message = Strings.Common.ERROR_GET_DATA;
                                res.send(data);
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
