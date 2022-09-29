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

    isValidPhoneNumber: (phoneNumber) => {
        const regExp = new RegExp(/^([0]{1})([1-9]{1})([0-9]{8})$/);
        return regExp.test(phoneNumber);
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

    isValidStarNumber: (value) => {
        return parseFloat(value) > 0 && parseFloat(value) <= 5.0 ? true : false;
    },

    formatStarNumber: (value) => {
        return parseFloat(value) > 0 && parseFloat(value) <= 5.0
            ? parseFloat(value).toFixed(1)
            : null;
    },

    isArray: (value) => {
        return Array.isArray(value);
    },

    isArrayEmpty: (value) => {
        if (Array.isArray(value)) {
            return value.length <= 0 ? true : false;
        } else {
            return false;
        }
    },

    isDateTimeStampGreaterThanCurrentDate: (timeStamp) => {
        return (
            new Date(new Date(timeStamp * 1000).toDateString()) >
            new Date(new Date().toDateString())
        );
    },

    // isDateTimeStampGreaterThanOrEqualCurrentDate: (timeStamp) => {
    //     return (
    //         new Date(new Date(timeStamp * 1000).toDateString()) >=
    //         new Date(new Date().toDateString())
    //     );
    // },
};

module.exports = {
    helper,
};
