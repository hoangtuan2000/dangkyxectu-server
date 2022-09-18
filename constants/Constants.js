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
    },

    ScheduleStatus: {
        PENDING: "Chờ Duyệt",
        APPROVED: "Đã Duyệt",
        COMPLETE: "Hoàn Thành",
        CANCELLED: "Đã Hủy",
        REFUSE: "Từ Chối",
    },

    ScheduleStatusCode: {
        PENDING: 1,
        APPROVED: 2,
        COMPLETE: 3,
        CANCELLED: 4,
        REFUSE: 5,
    },

    Styles: {
        COLOR_PRIMARY: "#1976d2",
        COLOR_SUCCESS: "green",
        COLOR_ERROR: "red",
        COLOR_SECONDARY: "gray",
        COLOR_PINK_LIGHT: "#ce93d8",
        COLOR_BLUE_LIGHT: "#29b6f6",
    },
};

module.exports = {
    Constants,
};
