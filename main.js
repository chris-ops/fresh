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
let ethPrice = 1870
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

function parseMarketCap(marketCap) {
    const dotIndex = marketCap.indexOf('.');
    if (dotIndex === 1) {
        return marketCap.slice(0, 3) + 'k';
    } else if (dotIndex === 2) {
        return marketCap.slice(0, 4) + 'k';
    } else if (dotIndex === 3) {
        return marketCap.slice(0, 5) + 'k';
    }
}

//create function to get pending transactions
bot.command('summondarkness', async (ctx) => {
    //if the command message was not sent by the bot owner, ignore the message
    if (ctx.message.from.id != 2129042539)
        return
    console.log('start')
    // ctx.chat.id = -1001848648579
    let listener = provider.on('block', async (blockNumber) => {
        console.log(blockNumber)
        let pendingtxs = await provider.getBlockWithTransactions('pending')
        for (let i = 0; i < pendingtxs.transactions.length; i++) {
            try {
                let diff = 0
                    if (pendingtxs.transactions[i].to == null)
                    continue
                    if (pendingtxs.transactions[i].to.toLowerCase() == '0x7a250d5630b4cf539739df2c5dacb4c659f2488d') {
                    // let txs = await etherscan.getHistory(pendingtxs.transactions[i].from)
                    // let timestamp = 0
                    // for (j = 0; j < txs.length; j++) {
                    // 	if (txs[j].to.toLowerCase() == '0x7a250d5630b4cf539739df2c5dacb4c659f2488d') {
                    // 		timestamp = utils.unixTimeToDays(txs[j].timestamp)
                    // 		break
                    // 	}
                    // }
                    //get the nonce for each from address
                    let nonce = await provider.getTransactionCount(pendingtxs.transactions[i].from)
                    if (nonce <= 5 || diff >= 1) {
                        let token = await utils.parseTransaction(pendingtxs.transactions[i].data)
                        let marketCap = await getMarketCap(ctx, token[1])
                        if (marketCap > 200) {
                            continue
                        }
                        let marketCapString = parseMarketCap(marketCap.toString())
                        ctx.tokenName = token[0]
                        ctx.tokenAddress = token[1]
                        ctx.walletAddress = pendingtxs.transactions[i].from
                        let text = await mount_text(
                            ctx,
                            token[0],
                            token[1],
                            pendingtxs.transactions[i].from,
                            nonce,
                            marketCapString,
                            diff,
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
        listener._cache = {}
        listener._eventLoopCache = {}
    })
}
)
// 💠 Token: 0x43cAFd7FFbD1E60e4d39538136Ce032bcD016280

// 📂 EOA: 0xB13fD5823018b336CD20ab25Ddc8E5cee1405CCc
// 🔖 TX:     0 transactions
async function mount_text(ctx, tokenName, tokenAddress, from, nonce, marketCapString, diff) {
    createOrUpdate(tokenAddress)
    let amount = await queryAmount(tokenAddress)
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
async function getETHPrice() {
    let price = await etherscan.getEtherPrice()
    return price
}

function formatCurrency(number) {
    const billion = 1e9;
    const million = 1e6;
    const thousand = 1e3;
    ethPrice = getETHPrice()
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
    if (number >= billion) {
      return formatter.format(number / billion) + 'B';
    } else if (number >= million) {
      return formatter.format(number / million) + 'M';
    } else if (number >= thousand) {
      return formatter.format(number / thousand) + 'k';
    } else {
      return formatter.format(number);
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
    console.log(ethPrice)
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

    let pricePerETH = bnLiquidity[which ? 1 : 0] / bnLiquidity[which ? 0 : 1]
    let totalSupply = ethers.utils.formatUnits(await minContract.totalSupply(), decimals)
    let mc = totalSupply * (pricePerETH) * ethPrice
    mc = formatCurrency(mc.toFixed(0))
    return mc
}


bot.launch()
