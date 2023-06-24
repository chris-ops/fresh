const { Pool } = require('pg');

const writer = new Pool({
    user: 'postgres',
    host: '',
    password: 'yagakimi4ever',
    database: 'tracker',
    port: '',
});

module.exports = writer;