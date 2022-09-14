const helper = {
    isNullOrEmpty: (value) => {
        return value === undefined || value === null || value === "";
    },

    isValidStringLength: (value, len) => {
        if ((typeof value == "string" || typeof value == "number") && len) {
            value = value.toString();
            if (value.length <= len) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    },

    compareBiggerDateTimeStamp: (startDateTimeStamp, endDateTimeStamp) => {
        return new Date(parseInt(startDateTimeStamp)) <=
            new Date(parseInt(endDateTimeStamp))
            ? true
            : false;
    },

    formatTimeStamp: (value) => {
        return Math.floor(parseInt(value) / 1000);
    },
};

module.exports = {
    helper,
};
