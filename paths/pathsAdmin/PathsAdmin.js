const testRouter = require("../../routers/routesAdmin/testRouter");
exports.setupPaths = function (app) {
    app.use("/api/products", testRouter);
    app.use("/api/products2", testRouter);
};
