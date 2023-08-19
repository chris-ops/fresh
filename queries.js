const { Pool } = require('pg');
const writer = new Pool({
    user: 'xerrien',
    host: 'database-1.ct5xszougzwl.us-east-1.rds.amazonaws.com',
    password: 'Yagakimi4ever',
    database: 'tracker',
    port: 5432,
});

async function createTable() {
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS freshtokens (
      token TEXT UNIQUE,
      amount INTEGER
    );
  `;
    await writer.query(createTableQuery);

    const createTableQuery2 = `
    CREATE TABLE IF NOT EXISTS approvalsToken (
        token TEXT PRIMARY KEY,
        tokenname TEXT,
        deployer TEXT,
        approves INTEGER,
        skip INTEGER default 0
    );
  `;
    await writer.query(createTableQuery2);

}

createTable()

async function createOrUpdate(tokenName) {
    try {
        const query = `
          INSERT INTO freshtokens (token, amount)
          VALUES ($1, 1)
          ON CONFLICT (token)
          DO UPDATE SET amount = freshtokens.amount + 1;
        `;

        const result = await writer.query(query, [tokenName]);
        console.log('Rows affected:', result.rowCount);

    } catch (error) {
        console.error('Error executing create or update query:', error);
    }
}

async function queryAmount(tokenName) {
    console.log('Querying text value:', tokenName);
    try {
        const query = 'SELECT amount FROM freshtokens WHERE token = $1';
        const result = await writer.query(query, [tokenName]);

        if (result.rowCount > 0) {
            const integerValue = result.rows[0].amount;
            console.log('Integer field value:', integerValue);
            return integerValue + 1;
        } else {
            console.log('Text value not found in the table');
            return 1;
        }

    } catch (error) {
        console.error('Error executing query:', error);
    }
}

async function addToTable(token, tokenname, deployer) {
    const insertQuery = `
    INSERT INTO approvalsToken (token, tokenname, deployer, approves)
    VALUES ($1, $2, $3, $4)
    `;
    await writer.query(insertQuery, [token, tokenname, deployer, 0]);
}

async function updateTokenName(tokenname) {
    const updateQuery = `
    UPDATE approvalsToken SET tokenname = tokenname WHERE token = $1`;
    await writer.query(updateQuery, [tokenname]);
}
async function UpdateApproves(token) {
    //increase the number of approves of the token
    const updateQuery = `
    UPDATE approvalsToken SET approves = approves + 1 WHERE token = $1`;
    await writer.query(updateQuery, [token]);
    //for the same token, update the name and the deployer
    // const updateQuery2 = `
    // UPDATE approvalsToken SET tokenname = $1, deployer = $2 WHERE token = $3`;
    // await writer.query(updateQuery2, [tokenName, deployer, token]);
}

async function checkIfTokenIsInTable() {
    const selectQuery = `
    SELECT token FROM approvalsToken`;
    const result = await writer.query(selectQuery);
    return result.rows;
}

async function deleteToken(token) {
    console.log('deleting token');
    const deleteQuery = `
    DELETE FROM approvalsToken WHERE token = $1`;
    await writer.query(deleteQuery, [token]);
}

async function getRowFromApproves(token) {
    const selectQuery = `
    SELECT tokenname, deployer, approves, skip FROM approvalsToken WHERE token = $1`;
    const result = await writer.query(selectQuery, [token]);
    return result.rows[0];
}

async function updateSkip(token) {
    //increase 1 skip
    const updateQuery = `
    UPDATE approvalsToken SET skip = skip + 1 WHERE token = $1`;
    await writer.query(updateQuery, [token]);
}

async function zeroSkip(token) {
    //make it 0
    const updateQuery = `
    UPDATE approvalsToken SET skip = 0 WHERE token = $1`;
    await writer.query(updateQuery, [token]);
}

module.exports = {
    createOrUpdate,
    queryAmount,
    addToTable,
    UpdateApproves,
    checkIfTokenIsInTable,
    deleteToken,
    getRowFromApproves,
    updateTokenName,
    updateSkip,
    zeroSkip,
};
