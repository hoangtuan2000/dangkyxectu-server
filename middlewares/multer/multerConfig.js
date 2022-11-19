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
    limits: { fileSize: 5242880 }, //file size 5MB
}).single("imageCar");

const uploadImage = multer({
    storage: multer.memoryStorage(),
    fileFilter: imageFilter,
    limits: { fileSize: 5242880 }, //file size 5MB
}).single("image");

const uploadMultipleImageMulter = multer({
    storage: multer.memoryStorage(),
    fileFilter: imageFilter,
    limits: { fileSize: 5242880 }, //file size 5MB
}).array("multipleImages", 8);

module.exports = { uploadImageMulter, uploadMultipleImageMulter, uploadImage };
