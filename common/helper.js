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

    isValidStringBetweenMinMaxLength: (value, minLen, maxLen) => {
        if (
            (typeof value == "string" || typeof value == "number") &&
            minLen &&
            maxLen
        ) {
            value = value.toString();
            if (value.length >= minLen && value.length <= maxLen) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    },

    isTimeStamp: (timeStamp) => {
        return new Date(parseInt(timeStamp)).getTime() > 0;
    },

    isValidEmail: (email) => {
        const regExp = new RegExp(
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
        );
        return regExp.test(email);
    },

    isValidPhoneNumber: (phoneNumber) => {
        const regExp = new RegExp(/^([0]{1})([1-9]{1})([0-9]{8})$/);
        return regExp.test(phoneNumber);
    },

    isStartTimeStampLessThanOrEqualEndTimeStamp: (
        startTimeStamp,
        endTimeStamp
    ) => {
        return (
            new Date(parseInt(startTimeStamp)) <=
            new Date(parseInt(endTimeStamp))
        );
    },

    isTwoEqualDateTimestamp: (startTimeStamp, endTimeStamp) => {
        return (
            new Date(parseInt(startTimeStamp)).toDateString() ==
            new Date(parseInt(endTimeStamp)).toDateString()
        );
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

    isValidArrayLength: (value, len) => {
        if (Array.isArray(value)) {
            return value.length == len ? true : false;
        } else {
            return false;
        }
    },

    isStartTimeStampSmallerEndTimestamp: (startTimeStamp, endTimeStamp) => {
        return (
            new Date(new Date(startTimeStamp * 1).toDateString()) <
            new Date(new Date(endTimeStamp * 1).toDateString())
        );
    },

    isDateTimeStampGreaterThanCurrentDate: (timeStamp) => {
        return (
            new Date(new Date(timeStamp * 1000).toDateString()) >
            new Date(new Date().toDateString())
        );
    },

    convertStringBooleanToBoolean: (stringBoolean) => {
        return stringBoolean.toString() == "true";
    },

    isDateTimeStampGreaterThanOrEqualCurrentDate: (timeStamp) => {
        return (
            new Date(new Date(timeStamp * 1000).toDateString()) >=
            new Date(new Date().toDateString())
        );
    },

    removeVietnameseAccents: (str) => {
        if (typeof str == "string") {
            str = str
                .toString()
                .replace(/??|??|???|???|??|??|???|???|???|???|???|??|???|???|???|???|???/g, "a");
            str = str.toString().replace(/??|??|???|???|???|??|???|???|???|???|???/g, "e");
            str = str.toString().replace(/??|??|???|???|??/g, "i");
            str = str
                .toString()
                .replace(/??|??|???|???|??|??|???|???|???|???|???|??|???|???|???|???|???/g, "o");
            str = str.toString().replace(/??|??|???|???|??|??|???|???|???|???|???/g, "u");
            str = str.toString().replace(/???|??|???|???|???/g, "y");
            str = str.toString().replace(/??/g, "d");
            str = str
                .toString()
                .replace(/??|??|???|???|??|??|???|???|???|???|???|??|???|???|???|???|???/g, "A");
            str = str.toString().replace(/??|??|???|???|???|??|???|???|???|???|???/g, "E");
            str = str.toString().replace(/??|??|???|???|??/g, "I");
            str = str
                .toString()
                .replace(/??|??|???|???|??|??|???|???|???|???|???|??|???|???|???|???|???/g, "O");
            str = str.toString().replace(/??|??|???|???|??|??|???|???|???|???|???/g, "U");
            str = str.toString().replace(/???|??|???|???|???/g, "Y");
            str = str.toString().replace(/??/g, "D");
            return str;
        }
    },

    diffDaysOfTwoTimeStamp: (startDate, endDate) => {
        const date1 = new Date(parseInt(startDate));
        const date2 = new Date(parseInt(endDate));
        // DATE DIFF => SELECT DATE RANGE
        const diffTime = Math.abs(date2 - date1);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    },
};

module.exports = {
    helper,
};
