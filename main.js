const { ethers } = require('ethers')
const utils = require('./utils.js')
const provider = new ethers.providers.WebSocketProvider('wss://proportionate-restless-arm.discover.quiknode.pro/8ffd3e105db61bb59142e25c4321f73c5395212d/');
const { Telegraf, Extra, Markup } = require('telegraf');
const { Pool } = require('pg');
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
}
createTable()

const bot = new Telegraf('5787240482:AAGT0lM1T15cOrSBdscUm04nYPquTbx7LmY')

//create fuinction to get pending transactions
bot.command('startdarkness', async (ctx) => {
    console.log('start')
    // ctx.chat.id = -1001848648579
    provider.on('block', async (blockNumber) => {
        let pendingtxs = await provider.getBlockWithTransactions('pending')
        for (let i = 0; i < pendingtxs.transactions.length; i++) {
            try {
                if (pendingtxs.transactions[i].to.toLowerCase() == '0x7a250d5630b4cf539739df2c5dacb4c659f2488d') {
                    //get the nonce for each from address
                    let nonce = await provider.getTransactionCount(pendingtxs.transactions[i].from)
                    console.log(nonce)
                    if (nonce <= 5) {
                        let token = await utils.parseTransaction(pendingtxs.transactions[i].data)
                        ctx.tokenName = token[0]
                        ctx.tokenAddress = token[1]
                        ctx.walletAddress = pendingtxs.transactions[i].from
                        let text = await mount_text(
                            ctx,
                            token[0],
                            token[1],
                            pendingtxs.transactions[i].from,
                            nonce
                        )

                        callback(ctx, text)
                    }

                }
            } catch (error) {
                console.log(error)
                continue
            }
        }
    })
}
)
// 💠 Token: 0x43cAFd7FFbD1E60e4d39538136Ce032bcD016280

// 📂 EOA: 0xB13fD5823018b336CD20ab25Ddc8E5cee1405CCc
// 🔖 TX:     0 transactions
async function mount_text(ctx, tokenName, tokenAddress, from, nonce) {
    createOrUpdate(tokenAddress)
    let amount = await queryAmount(tokenAddress)
    return `${ctx.tokenName}    <b>#${amount}</b>\n\nToken: <code>${ctx.tokenAddress}</code>\nWallet: <code>${from}</code>\nTransactions: ${nonce}`
}

async function callback(ctx, message) {
    message = await ctx.replyWithHTML({text: message}, reply_markup=Markup.inlineKeyboard([
        Markup.button.url('Etherscan', `https://etherscan.io/token/${ctx.tokenAddress}`),
        Markup.button.url('Wallet', `https://etherscan.io/address/${ctx.walletAddress}`),
        Markup.button.url('Maestro', `https://t.me/MaestroSniperBot?start=${ctx.tokenAddress}`),
        Markup.button.url('Maestro Pro', `https://t.me/MaestroProBot?start=${ctx.tokenAddress}`),
    ]))
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

async function getLiquidity(tokenA) {
    // Connect to the Ethereum network
    // Create an instance of the UniswapV2Factory contract
    const factory = new ethers.Contract(
      UNISWAP_FACTORY_ADDRESS,
      UNISWAP_FACTORY_ABI,
      provider
    );
  
    if (liquidityPoolAddress == ethers.constants.AddressZero)
      return 0
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
    let token0 = await liquidityPool.token0()
    let which = token0.toLowerCase() != xeth
    let nLiquidity = which ? ethers.utils.formatEther(bnLiquidity[0]) : ethers.utils.formatEther(bnLiquidity[1])
  
    let pricePerETH = which ? parseFloat(ethers.utils.formatEther(bnLiquidity[0])) / (parseFloat(ethers.utils.formatEther(bnLiquidity[1])))
      :
      parseFloat(ethers.utils.formatEther(bnLiquidity[1])) / (parseFloat(ethers.utils.formatEther(bnLiquidity[0])))
  
    let totalSupply = ethers.utils.formatEther(await minContract.totalSupply())
    let mc = totalSupply * (pricePerETH) * 1900 / 100
  
    return mc
}


bot.launch()