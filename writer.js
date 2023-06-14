const { Pool } = require('pg');

const writer = new Pool({
    user: 'xerrien',
    host: 'database-1.ct5xszougzwl.us-east-1.rds.amazonaws.com',
    password: 'Yagakimi4ever',
    database: 'tracker',
    port: 5432,
});

module.exports = writer;