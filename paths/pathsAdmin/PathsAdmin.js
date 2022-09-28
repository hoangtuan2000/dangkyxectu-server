const RoutersAdmin = require("../../routers/routersAdmin/RoutersAdmin");
exports.setupPaths = function (app) {
    app.use("/api/admin", RoutersAdmin);
};
