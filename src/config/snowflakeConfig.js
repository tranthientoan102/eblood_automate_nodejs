const snowflake = require('snowflake-sdk');

console.log(`process.env.SNOWFLAKE_USERNAME = ${process.env.SNOWFLAKE_USERNAME}`)


// Create a Snowflake connection
const connection = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT, // Replace with your Snowflake account
    username: process.env.SNOWFLAKE_USERNAME, // Replace with your Snowflake username
    // user: process.env.SNOWFLAKE_USERNAME, // Replace with your Snowflake username
    // password: process.env.SNOWFLAKE_PASSWORD, // Replace with your Snowflake password
    authenticator: process.env.SNOWFLAKE_AUTHENTICATOR,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE, // Replace with your Snowflake warehouse
    database: process.env.SNOWFLAKE_DATABASE, // Replace with your Snowflake database
    schema: process.env.SNOWFLAKE_SCHEMA, // Replace with your Snowflake schema
});

module.exports = connection;