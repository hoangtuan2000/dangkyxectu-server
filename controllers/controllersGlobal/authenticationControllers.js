const db = require("../../models/index");
const ldap = require("ldapjs");
const ldapClient = require("../../middlewares/ldap/ldapConfig");

const login = async (req, res) => {
    const {username, password} = req.body
    ldapClient.ldapClient.bind(
        `cn=${username},ou=users,ou=system`,
        password,
        function (err) {
            if (err) {
                console.log("Error in message ", err.message);
                console.log("Error in name ", err.name);
                if (err.name == new ldap.InvalidCredentialsError().name) {
                    console.log(
                        "Tài Khoản Hoặc Mật Khẩu Không Chính Xác",
                        err.name
                    );
                    res.send("Tài Khoản Hoặc Mật Khẩu Không Chính Xác");
                } else if (
                    err.name == new ldap.UnwillingToPerformError().name
                ) {
                    console.log("Lỗi Không Xác Định", err.name);
                    res.send("Lỗi Không Xác Định");
                } else {
                    console.log("server off");
                    res.send("server không hoạt động");
                }
            } else {
                console.log("ok");
                res.send("Đăng Nhập Thành Công");
            }
        }
    );
};
module.exports = {
    login,
};
