const RouterGlobal = require("../../routers/routersGlobal/RouterGlobal");
exports.setupPaths = function (app) {
    app.use("", RouterGlobal);
};
