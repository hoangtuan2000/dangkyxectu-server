const { executeQuery } = require("../../common/function");
const { helper } = require("../../common/helper");
const { Constants } = require("../../constants/Constants");
const { Strings } = require("../../constants/Strings");
const db = require("../../models/index");
const multer = require("multer");
const {
    uploadMultipleImageMulter,
} = require("../../middlewares/multer/multerConfig");
const { appFirebase } = require("../../middlewares/firebase/firebaseConfig");
const {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
} = require("firebase/storage");
const { async } = require("@firebase/util");

const validateUploadImageBrokenCarParts = async (req, res, next) => {
    let data = { ...Constants.ResultData };
    uploadMultipleImageMulter(req, res, function (err) {
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
                    data.message = Strings.Common.ONLY_EIGHT_IMAGES;
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
            if (req.files) {
                if (req.files.length > 0) {
                    next();
                } else {
                    data.status = Constants.ApiCode.BAD_REQUEST;
                    data.message = Strings.Common.ERROR_NO_PICTURE;
                    res.status(200).send(data);
                }
            } else {
                data.status = Constants.ApiCode.BAD_REQUEST;
                data.message = Strings.Common.ERROR_NO_PICTURE;
                res.status(200).send(data);
            }
        }
    });
};

const uploadMultipleImageToFirebase = async (req, res, next) => {
    if (req.files) {
        // UPLOAD
        const uploadedImages = await Promise.all(
            req.files.map(async (file, index) => {
                const currentDate = Date.now();
                const randomNumber = Math.floor(Math.random() * 10);
                const storage = getStorage(appFirebase);
                const storageRef = ref(
                    storage,
                    `imagesBrokenCarParts/${currentDate}_${randomNumber}_${file.originalname}`
                );

                const metadata = {
                    contentType: file.mimetype,
                };

                const uploadTask = uploadBytesResumable(
                    storageRef,
                    file.buffer,
                    metadata
                );

                const url = await new Promise((resolve, reject) => {
                    uploadTask.on(
                        "state_changed",
                        (snapshot) => {},
                        (error) => {
                            resolve(false);
                        },
                        () => {
                            getDownloadURL(uploadTask.snapshot.ref).then(
                                (downloadURL) => {
                                    resolve(downloadURL);
                                }
                            );
                        }
                    );
                });

                return url;
            })
        );

        console.log();

        for (let i = 0; i < uploadedImages.length; i++) {
            if (uploadedImages[i] == false) {
                req.arrayUrlImagesFirebase = uploadedImages;
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR_UPLOAD_IMAGE;
                res.status(200).send(data);
                deleteMultipleImagesFromFirebase();
                break;
            } else {
                req.arrayUrlImagesFirebase = uploadedImages;
                next();
            }
        }
    } else {
        req.arrayUrlImagesFirebase = null;
        next();
    }
};

const deleteMultipleImagesFromFirebase = async (req, res) => {
    let arrUrlImage = req.arrayUrlImagesFirebase;
    if (arrUrlImage.length > 0) {
        for (let i = 0; i < arrUrlImage.length > 0; i++) {
            if (arrUrlImage[i] != false) {
                const storage = getStorage(appFirebase);
                const desertRef = ref(storage, arrUrlImage[i]);
                deleteObject(desertRef)
                    .then(() => {
                        console.log("dateleImageFromFirebase success");
                    })
                    .catch((error) => {
                        console.log("dateleImageFromFirebase err");
                    });
            }
        }
    }
};

module.exports = {
    validateUploadImageBrokenCarParts,
    uploadMultipleImageToFirebase,
};
