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
};

module.exports = {
    Constants,
};
