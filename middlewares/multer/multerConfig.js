const multer = require("multer");

const imageFilter = function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jfif|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = "ONLY_SUPPORT_IMAGE";
        return cb(new Error("ONLY_SUPPORT_IMAGE"), false);
    }
    cb(null, true);
};

const uploadImageMulter = multer({
    storage: multer.memoryStorage(),
    fileFilter: imageFilter,
    limits: { fileSize: 3145728 }, //file size 3MB
}).single("imageCar");

module.exports = { uploadImageMulter };
