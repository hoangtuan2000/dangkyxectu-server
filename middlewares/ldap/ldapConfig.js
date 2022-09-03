const ldap = require("ldapjs");

const ldapClient = ldap.createClient({
    url: ["ldap://127.0.0.1:10389"],
    reconnect: true,
    connectTimeout: 1000,
});

module.exports = {
    ldapClient,
};
