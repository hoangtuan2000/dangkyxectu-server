const { Constants } = require("./Constants");

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
        YOUR_LOGIN_SESSION_EXPIRED: "Phiên Đăng Nhập Của Bạn Đã Hết Hạn",
        NOT_PERMISSION_ACCESS: "Không Có Quyền Truy Cập",
        USER_NOT_EXIST: "Người Dùng Không Tồn Tại",
        DUPLICATE_SCHEDULE: "Lịch Trình Bị Trùng Lặp",
        INVALID_DATE: "Ngày Không Hợp Lệ",
        INVALID_REQUEST: "Yêu Cầu Không Hợp Lệ",
        INVALID_DATA: "Dữ Liệu Không Hợp Lệ",
        SIGN_UP_SUCCESS: "Đăng Ký Thành Công",
        UPDATE_SUCCESS: "Cập Nhật Thành Công",
        UPDATE_PHONE_NUMBER_SUCCESS: "Cập Nhật Số Điện Thoại Thành Công",
        CANCEL_SUCCESSFUL_REGISTRATION: "Hủy Đăng Ký Thành Công",
        LIMIT_PART_COUNT: "Ảnh Quá Nhiều Phần",
        LIMIT_FILE_SIZE: "Ảnh Quá Lớn",
        LIMIT_FILE_COUNT: "Quá Nhiều Ảnh",
        LIMIT_FIELD_KEY: "Tên Trường Quá Dài",
        LIMIT_FIELD_VALUE: "Giá Trị Trường Quá Dài",
        LIMIT_FIELD_COUNT: "Quá Nhiều Trường",
        LIMIT_UNEXPECTED_FILE: "Trường Không Mong Đợi",
        ONLY_EIGHT_IMAGES: "Chỉ Cho Phép Tải Lên 8 Ảnh",
        CAR_STATUS_HAS_BEEN_UPDATED_BEFORE:
            "Trạng Thái Xe Đã Được Cập Nhật Trước Đó",
        MISSING_FIELD_NAME: "Thiếu Tên Trường",
        ONLY_SUPPORT_IMAGE: "Chỉ Hỗ Trợ Tệp Hình Ảnh",
        ERROR_UPLOAD_IMAGE: "Lỗi Tải Ảnh",
        ERROR_NO_PICTURE: "Lỗi Không Có Hình Ảnh",
        LICENSE_PLATES_EXIST: "Biển Số Xe Đã Tồn Tại",
        DATA_IS_UNCHANGED: "Dữ Liệu Không Thay Đổi",
        SUPPORT_LENGTH_LICENSE_PLATES: `Biển Số Từ ${Constants.Common.CHARACTERS_MIN_LENGTH_LICENSE_PLATES} - ${Constants.Common.CHARACTERS_MAX_LENGTH_LICENSE_PLATES} Ký Tự`,
    },
};

module.exports = {
    Strings,
};
