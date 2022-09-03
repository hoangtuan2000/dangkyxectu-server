const Strings = {
    Common: {
        SUCCESS: "Thành Công",
        ERROR: "Có Lỗi Xảy ra",
        UNAUTHENTICATED: "Xác Thực Thất Bại",
        ERROR_PASSWORD_USERID: "Tài Khoản Hoặc Mật Khẩu Không Chính Xác",
        ERROR_SERVER: "Lỗi Máy Chủ",
        ERROR_CLIENT: "Lỗi Máy Khách",
        NOT_ENOUGH_DATA: "Không Đủ Dữ Liệu",
        SERVICE_UNAVAILABLE: "Máy Chủ Không Có Sẵn",
        ERROR_GET_DATA: "Lỗi Lấy Dữ Liệu",
    },

    StatusCodeAPI: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        REQUEST_TIMEOUT: 408,
        INTERNAL_SERVER_ERROR: 500,
        SERVICE_UNAVAILABLE: 503,
    },
};

module.exports = {
    Strings,
};
