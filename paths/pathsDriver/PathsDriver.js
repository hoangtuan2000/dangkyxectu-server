const RouterDriver = require("../../routers/routersDriver/RouterDriver");
exports.setupPaths = function (app) {
    app.use("/api", RouterDriver);
};
