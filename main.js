const { ethers } = require('ethers')
const utils = require('./utils.js')
const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/2a6debe65f1641d1a4d86af1c34a7e41');
const { Telegraf, Extra, Markup } = require('telegraf');
const { Pool } = require('pg');
const UNISWAP_FACTORY_ADDRESS = require("./uniswap_factory_address.js");
const UNISWAP_ROUTER_ABI = require("./uniswap_router_abi.js");
const UNISWAP_FACTORY_ABI = require("./uniswap_factory_abi.js");
const UNISWAP_PAIR_ABI = require("./uniswap_pair_abi.js");
const INTERFACE_UNISWAP = new ethers.utils.Interface(UNISWAP_ROUTER_ABI)
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const MIN_ABI = require("./min_abi.js");
const etherscan = new ethers.providers.EtherscanProvider('homestead', 'ADITHDAHJGR15JV5FMB4C18JBVPINZ2UDP');
//uniswap router INTERFACE not contract

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
    CREATE TABLE IF NOT EXISTS approves (
        token TEXT PRIMARY KEY,
        tokenname TEXT,
        deployer TEXT,
        approves INT
    );
  `;
    await queries.writer.query(createTableQuery2);

}
createTable()

const bot = new Telegraf('5787240482:AAGT0lM1T15cOrSBdscUm04nYPquTbx7LmY')

function parseMarketCap(marketCap) {
    const dotIndex = marketCap.indexOf('.');
    if (dotIndex === 1) {
        return `${marketCap.slice(0, 3)}k`;
    } else if (dotIndex === 2) {
        return `${marketCap.slice(0, 4)}k`;
    } else if (dotIndex === 3) {
        return `${marketCap.slice(0, 5)}k`;
    }
}

//create function to get pending transactions
bot.command('summondarkness', async (ctx) => {
    //if the command message was not sent by the bot owner, ignore the message
    if (ctx.message.from.id != 2129042539)
        return
    console.log('start')
    // ctx.chat.id = -1001848648579
    const listener = provider.on('block', async (blockNumber) => {
        console.log(blockNumber)
        const pendingtxs = await provider.getBlockWithTransactions('pending')
        await scanForFreshWallets(ctx, pendingtxs)
        await scanForApprovals(ctx, pendingtxs)
        listener._cache = {}
        listener._eventLoopCache = {}
    })
}
)
async function scanForFreshWallets(ctx, pendingtxs) {
    for (const transaction of pendingtxs.transactions) {
        try {
            const diff = 0
            if (transaction.to == null)
                continue
            if (transaction.to.toLowerCase() == '0x7a250d5630b4cf539739df2c5dacb4c659f2488d') {
                const nonce = await provider.getTransactionCount(transaction.from)
                if (nonce <= 5 || diff >= 1) {
                    const token = await utils.parseTransaction(transaction.data)
                    const marketCap = await getMarketCap(ctx, token[1])
                    if (marketCap > 200) {
                        continue
                    }
                    const marketCapString = parseMarketCap(marketCap.toString())
                    ctx.tokenName = token[0]
                    ctx.tokenAddress = token[1]
                    ctx.walletAddress = transaction.from
                    const text = await mount_text(
                        ctx,
                        token[0],
                        token[1],
                        transaction.from,
                        nonce,
                        marketCapString,
                        diff
                    )
                    if (text == 0)
                        continue
                    callback(ctx, text)
                }
            }
        } catch (error) {
            console.log(error)
            continue
        }
    }
}

async function scanForApprovals(ctx, pendingtxs) {
    for (tx of pendingtxs.transactions) try {
        if (txs.data.includes('0x60806040')) {
            const min_contract = new ethers.Contract(tx.to, abi, wsprovider)
            const name = await min_contract.name()
            const symbol = await min_contract.symbol()
            const full_name = `${name} (${symbol})`
            await addToTable(tx.to, full_name, tx.from)
            continue
        }
        if (checkIfTokenIsInTable(tx.to)) {
            if (txs.data.includes('0x095ea7b3'))
            await updateApproves(tx.to)
            const data = await getAllFieldsExceptToken(tx.to)
            //send a message with a button linking to the contract. use ctx.replyWithMarkdownV2
            //text: <tokenname> | <approvals> </br> Token:<code>tx.to</code> </br> Deployer: <code>data.deployer</code>
            bot.telegram.sendMessage(-1001848648579, `${data.tokenname} | ${data.approves} \n Token: ${tx.to} \n Deployer: ${data.deployer}`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'View Contract',
                                url: `https://etherscan.io/address/${tx.to}`
                            }
                        ]
                    ]
                }
            })
        }
    } catch (error) {
        continue
    }
}

// 💠 Token: 0x43cAFd7FFbD1E60e4d39538136Ce032bcD016280

// 📂 EOA: 0xB13fD5823018b336CD20ab25Ddc8E5cee1405CCc
// 🔖 TX:     0 transactions
async function mount_text(ctx, tokenName, tokenAddress, from, nonce, marketCapString, diff) {
    createOrUpdate(tokenAddress)
    const amount = await queryAmount(tokenAddress)
    if (amount > 5)
        return 0
    return `${ctx.tokenName} | ${marketCapString} | <b>#${amount}</b>\n\nToken: <code>${ctx.tokenAddress}</code>\nWallet: <code>${from}</code>\nDays inactive: ${diff}\nTransactions: ${nonce}`
}

async function callback(ctx, message) {
    message = await ctx.replyWithHTML(
        { text: message },
        reply_markup = Markup.inlineKeyboard(
            [
                [
                    Markup.button.url('Etherscan', `https://etherscan.io/token/${ctx.tokenAddress}`),
                    Markup.button.url('Wallet', `https://etherscan.io/address/${ctx.walletAddress}`),
                    Markup.button.url('Maestro', `https://t.me/MaestroSniperBot?start=${ctx.tokenAddress}`),
                    Markup.button.url('Maestro Pro', `https://t.me/MaestroProBot?start=${ctx.tokenAddress}`)
                ],
                [
                    Markup.button.url('Dextools', `https://www.dextools.io/app/en/ether/pair-explorer/${ctx.pairAddress}`),
                    Markup.button.url('Dexscreener', `https://dexscreener.com/ethereum/${ctx.pairAddress}`),
                    Markup.button.url('Dexview', `https://www.dexview.com/eth/${ctx.tokenAddress}`),
                ]
            ]
        )
    )
}

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
async function getMarketCap(ctx, tokenA) {
    // Connect to the Ethereum network
    // Create an instance of the UniswapV2Factory contract
    const factory = new ethers.Contract(
        UNISWAP_FACTORY_ADDRESS,
        UNISWAP_FACTORY_ABI,
        provider
    );
    // Get the address of the liquidity pool from the factory for the given token pair
    const liquidityPoolAddress = await factory.getPair(tokenA, WETH_ADDRESS);

    if (liquidityPoolAddress == ethers.constants.AddressZero)
        return 0
    ctx.pairAddress = liquidityPoolAddress
    // Create an instance of the UniswapV2Pair contract
    const liquidityPool = new ethers.Contract(
        liquidityPoolAddress,
        UNISWAP_PAIR_ABI,
        provider
    );
    // Get the liquidity pool address for the given token pair
    let minContract = new ethers.Contract(tokenA, MIN_ABI, provider)
    // Get the total liquidity in the pool
    const bnLiquidity = await liquidityPool.getReserves();
    let decimals = await minContract.decimals()
    let token0 = await liquidityPool.token0()
    let which = token0.toLowerCase() != WETH_ADDRESS
    let nLiquidity = which ? ethers.utils.formatEther(bnLiquidity[0]) : ethers.utils.formatEther(bnLiquidity[1])

    let pricePerETH = which ? parseFloat(ethers.utils.formatUnits(bnLiquidity[1], decimals)) / (parseFloat(ethers.utils.formatEther(bnLiquidity[0])))
        :
        parseFloat(ethers.utils.formatEther(bnLiquidity[0])) / (parseFloat(ethers.utils.formatUnits(bnLiquidity[1], decimals)))

    let totalSupply = ethers.utils.formatUnits(await minContract.totalSupply(), decimals)
    console.log(pricePerETH)
    let mc = totalSupply * (pricePerETH) * 1870 / 1000
    return mc.toString().slice(0, 5)
}

async function addToTable(token, tokenname, deployer) {
    const insertQuery = `
    INSERT INTO approves (token, tokenname, deployer, approves)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (token) DO NOTHING
    `;
    await queries.writer.query(insertQuery, [token, tokenname, deployer, 0]);
}

async function updateApproves(token) {
    const updateQuery = `
    UPDATE approves SET approves = approves + 1 WHERE token = $1`;
    await queries.writer.query(updateQuery, [token]);
}

async function checkIfTokenIsInTable(token) {
    const selectQuery = `
    SELECT * FROM approves WHERE token = $1`;
    const result = await queries.reader.query(selectQuery, [token]);
    return result.rows[0];
}

async function getAllFieldsExceptToken(token) {
    const selectQuery = `
    SELECT tokenname, deployer, approves FROM approves WHERE token = $1`;
    const result = await queries.reader.query(selectQuery, [token]);
    return result.rows[0];
}



bot.launch()
