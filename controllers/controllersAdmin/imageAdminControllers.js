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

const uploadImage = async (req, res, next) => {
    const {} = req.body;
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
                // UPLOAD FIREBASE STRORAGE
                const storage = getStorage(appFirebase);
                const storageRef = ref(
                    storage,
                    `images/${req.file.originalname}`
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
                    (snapshot) => {
                        // const progress =
                        //     (snapshot.bytesTransferred / snapshot.totalBytes) *
                        //     100;
                        // console.log("Upload is " + progress + "% done");
                        // switch (snapshot.state) {
                        //     case "paused":
                        //         console.log("Upload is paused");
                        //         break;
                        //     case "running":
                        //         console.log("Upload is running");
                        //         break;
                        // }
                    },
                    (error) => {
                        data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                        data.message = Strings.Common.ERROR_UPLOAD_IMAGE;
                        res.status(200).send(data);
                    },
                    () => {
                        getDownloadURL(uploadTask.snapshot.ref).then(
                            (downloadURL) => {
                                req.urlImageFirebase = downloadURL;
                                next();
                            }
                        );
                    }
                );
            } else {
                data.status = Constants.ApiCode.INTERNAL_SERVER_ERROR;
                data.message = Strings.Common.ERROR_SERVER;
                res.status(200).send(data);
            }
        }
    });
};

module.exports = {
    uploadImage,
};
