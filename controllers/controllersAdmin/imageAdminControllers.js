const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const db = require("../../models/index");
const multer = require("multer");
const { uploadImageMulter } = require("../../middlewares/multer/multerConfig");
const { appFirebase } = require("../../middlewares/firebase/firebaseConfig");
const {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
} = require("firebase/storage");

const validateUploadImageWhenCreateCar = async (req, res, next) => {
    let data = { ...Constants.ResultData };
    uploadImageMulter(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            switch (err.code) {
                case "LIMIT_PART_COUNT":
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.LIMIT_PART_COUNT;
                    break;
                case "LIMIT_FILE_SIZE":
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.LIMIT_FILE_SIZE;
                    break;
                case "LIMIT_FILE_COUNT":
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.LIMIT_FILE_COUNT;
                    break;
                case "LIMIT_FIELD_KEY":
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.LIMIT_FIELD_KEY;
                    break;
                case "LIMIT_FIELD_VALUE":
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.LIMIT_FIELD_VALUE;
                    break;
                case "LIMIT_FIELD_COUNT":
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.LIMIT_FIELD_COUNT;
                    break;
                case "LIMIT_UNEXPECTED_FILE":
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.LIMIT_UNEXPECTED_FILE;
                    break;
                case "MISSING_FIELD_NAME":
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.MISSING_FIELD_NAME;
                    break;
                default:
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.INVALID_DATA;
                    break;
            }
            res.status(200).send(data);
        } else if (err) {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.ONLY_SUPPORT_IMAGE;
            res.status(200).send(data);
        } else {
            if (req.file) {
                next();
            } else {
                data.status = Constants.ApiCode.BAD_REQUEST;
                data.message = Strings.Common.ERROR_NO_PICTURE;
                res.status(200).send(data);
            }
        }
    });
};

const uploadImageToFirebase = async (req, res, next) => {
    if (req.file) {
        let data = { ...Constants.ResultData };
        const currentDate = Date.now();
        const randomNumber = Math.floor(Math.random() * 10);
        const storage = getStorage(appFirebase);
        const storageRef = ref(
            storage,
            `images/${currentDate}_${randomNumber}_${req.file.originalname}`
        );
        const metadata = {
            contentType: req.file.mimetype,
        };
        const uploadTask = uploadBytesResumable(
            storageRef,
            req.file.buffer,
            metadata
        );
        uploadTask.on(
            "state_changed",
            (snapshot) => {},
            (error) => {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR_UPLOAD_IMAGE;
                res.status(200).send(data);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    req.urlImageFirebase = downloadURL;
                    next();
                });
            }
        );
    } else {
        req.urlImageFirebase = null;
        next();
    }
};

const deteleImageFromFirebase = async (req, res, next) => {
        let deleteImage = req.deleteImage
        const storage = getStorage(appFirebase);
        const desertRef = ref(storage, deleteImage);
        deleteObject(desertRef)
            .then(() => {
                console.log('dateleImageFromFirebase success');
                next()
            })
            .catch((error) => {
                console.log('dateleImageFromFirebase err');
                next()
            });
};

const validateUploadImageWhenUpdateCar = async (req, res, next) => {
    let data = { ...Constants.ResultData };
    uploadImageMulter(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            switch (err.code) {
                case "LIMIT_PART_COUNT":
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.LIMIT_PART_COUNT;
                    break;
                case "LIMIT_FILE_SIZE":
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.LIMIT_FILE_SIZE;
                    break;
                case "LIMIT_FILE_COUNT":
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.LIMIT_FILE_COUNT;
                    break;
                case "LIMIT_FIELD_KEY":
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.LIMIT_FIELD_KEY;
                    break;
                case "LIMIT_FIELD_VALUE":
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.LIMIT_FIELD_VALUE;
                    break;
                case "LIMIT_FIELD_COUNT":
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.LIMIT_FIELD_COUNT;
                    break;
                case "LIMIT_UNEXPECTED_FILE":
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.LIMIT_UNEXPECTED_FILE;
                    break;
                case "MISSING_FIELD_NAME":
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.MISSING_FIELD_NAME;
                    break;
                default:
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.INVALID_DATA;
                    break;
            }
            res.status(200).send(data);
        } else if (err) {
            data.status = Constants.ApiCode.BAD_REQUEST;
            data.message = Strings.Common.ONLY_SUPPORT_IMAGE;
            res.status(200).send(data);
        } else {
            next();
        }
    });
};

module.exports = {
    validateUploadImageWhenCreateCar,
    uploadImageToFirebase,
    deteleImageFromFirebase,
    validateUploadImageWhenUpdateCar,
};
