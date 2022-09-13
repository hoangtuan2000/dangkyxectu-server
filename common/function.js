const executeQuery = async (connect, query, params) => {
    return new Promise((resolve, reject) => {
        connect.query(query, params, (err, result) => {
            if (err) {
                return resolve(false);
            }

            return resolve(result);
        });
    });
};

module.exports = {executeQuery} 