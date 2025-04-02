const connection = require('../config/snowflakeConfig');

async function runQuery(query) {
    return new Promise((resolve, reject) => {
        connection.connectAsync()
            .then(() => {
                console.log('Successfully connected to Snowflake.');

                connection.execute({
                    sqlText: query,
                    complete: (err, stmt, rows) => {
                        if (err) {
                            console.error('Failed to execute query:', err.message);
                            return reject(err);
                        }

                        console.log('Query executed successfully.');
                        resolve(rows);
                    },
                });
            })
            .catch((err) => {
                console.error('Unable to connect to Snowflake:', err.message);
                reject(err);
            });
    });
}

module.exports = {
    runQuery,
};