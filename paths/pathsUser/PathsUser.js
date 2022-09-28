const RouterUser = require("../../routers/routersUser/RouterUser");
exports.setupPaths = function (app) {
    app.use("/api/user", RouterUser);
};
