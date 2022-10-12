const Constants = {
    ResultData: {
        status: "",
        message: "",
        data: [],
    },

    ResultDataList: {
        status: "",
        message: "",
        sizeQuerySnapshot: 0,
        limitEntry: 0,
        page: 0,
        data: [],
    },

    ApiCode: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        REQUEST_TIMEOUT: 408,
        INTERNAL_SERVER_ERROR: 500,
        SERVICE_UNAVAILABLE: 503,
    },

    Common: {
        PAGE: 1,
        LIMIT_ENTRY: 10,
        CHARACTERS_MIN_LENGTH_LICENSE_PLATES: 7,
        CHARACTERS_MAX_LENGTH_LICENSE_PLATES: 10,
    },

    RoleCode: {
        ADMIN: 1,
        DRIVER: 2,
        USER: 3,
    },

    ScheduleStatus: {
        PENDING: "Chờ Duyệt",
        APPROVED: "Đã Duyệt",
        COMPLETE: "Hoàn Thành",
        CANCELLED: "Đã Hủy",
        REFUSE: "Từ Chối",
        RECEIVED: "Đã Nhận",
        MOVING: "Đang Di Chuyển",
    },

    ScheduleStatusCode: {
        PENDING: 1,
        APPROVED: 2,
        COMPLETE: 3,
        CANCELLED: 4,
        REFUSE: 5,
        RECEIVED: 6,
        MOVING: 7,
    },

    CarStatusCode: {
        WORK: 1,
        STOP_WORKING: 2,
        MAINTENANCE: 3,
    },

    CarLicenseCode: {
        REGISTRATION_CERTIFICATE: 1,
        PERIODIC_INSPECTION_CERTIFICATE: 2,
        INSURANCE: 3,
    },

    CarLicense: {
        REGISTRATION_CERTIFICATE: "registrationCertificate",
        PERIODIC_INSPECTION_CERTIFICATE: "periodicInspectionCertificate",
        INSURANCE: "insurance",
    },

    LicenseCode: {
        EXPIRES: 1,
        NOT_EXPIRES: 0,
    },

    // NameBrokenCarParts: {
    //     FRONT_OF_CAR: "frontOfCar",
    //     BACK_OF_CAR: "backOfCar",
    //     CAR_FRONT_LIGHTS: "carFrontLights",
    //     CAR_BACK_LIGHTS: "carBackLights",
    //     LEFT_CAR_BODY: "leftCarBody",
    //     RIGHT_CAR_BODY: "rightCarBody",
    //     CAR_CONTROL_CENTER: "carControlCenter",
    //     OTHER_CAR_PARTS: "otherCarParts",
    // },

    Styles: {
        COLOR_PRIMARY: "#1976d2",
        COLOR_SUCCESS: "green",
        COLOR_ERROR: "red",
        COLOR_SECONDARY: "gray",
        COLOR_PINK_LIGHT: "#ce93d8",
        COLOR_BLUE_LIGHT: "#29b6f6",
        COLOR_BLUE_GREEN: "#03a882",
    },
};

module.exports = {
    Constants,
};
