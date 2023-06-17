const { ethers } = require('ethers')
const utils = require('./utils.js')
const { Telegraf, Markup } = require('telegraf');
const queries = require('./queries.js')

const provider = new ethers.providers.WebSocketProvider('ws://127.0.0.1:8546');
const MIN_ABI = require("./min_abi.js");


const bot = new Telegraf('5787240482:AAGT0lM1T15cOrSBdscUm04nYPquTbx7LmY')

//create function to get pending transactions
bot.command('summondarkness', async (ctx) => {
    //if the command message was not sent by the bot owner, ignore the message
    if (ctx.message.from.id != 2129042539)
        return
    console.log('start')
    // ctx.chat.id = -1001848648579
    const listener = provider.on('block', async (blockNumber) => {
        console.log(blockNumber)
        const isInTable = await queries.checkIfTokenIsInTable();
        const pendingtxs = await provider.getBlockWithTransactions('pending')
        await scanForFreshWallets(ctx, pendingtxs)
        await scanForApprovals(ctx, pendingtxs, isInTable)
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
            if (transaction.to.toLowerCase() == '0x7a250d5630b4cf539739df2c5dacb4c659f2488d'
                || transaction.to.toLowerCase() == '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad') {
                const nonce = await provider.getTransactionCount(transaction.from)
                if (nonce <= 5 || diff >= 1) {
                    const token = await utils.parseTransaction(transaction.data)
                    const marketCap = await utils.getMarketCap(ctx, token[1])
                    if (marketCap > 200) {
                        continue
                    }
                    const marketCapString = utils.parseMarketCap(marketCap.toString())
                    ctx.tokenName = token[0]
                    ctx.tokenAddress = token[1]
                    ctx.walletAddress = transaction.from
                    const text = await utils.mount_text(
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
                    sendMessage(ctx, text)
                }
            }
        } catch (error) {
            console.log(error)
            continue
        }
    }
}
function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
  }

async function scanForApprovals(ctx, pendingtxs, isInTable) {
    for (tx of pendingtxs.transactions) {
        try {
            if (tx.data.slice(0, 10) == '0x60806040')
                console.log(tx.data.slice(0, 10))
            switch (tx.data.slice(0, 10)) {
                case '0x60806040': {
                    console.log('new token')
                    console.log(tx.creates)
                    const contractAddress = tx.creates
                    const min_contract = new ethers.Contract(tx.creates, MIN_ABI, provider);
                    const name = await utils.getTokenName(tx.creates, min_contract);
                    console.log('CONTRACT ', tx.creates)
                    console.log('contractAddress ', contractAddress)
                    await queries.addToTable(tx.creates.slice(2), name, tx.from);
                    break;
                }
                case '0x095ea7b3': {
                    //check if the token is in the key:pair isInTable
                    const token = getKeyByValue(isInTable, tx.to.slice(2))
                    if (token == undefined)
                        break
                    await queries.updateApproves(token)

                    const data = await queries.getRowFromApproves(token);
                    const message = `${data.tokenname} | ${data.approves}\nToken: ${tx.to}\nDeployer: ${data.deployer}`;
                    const replyMarkup = {
                        inline_keyboard: [
                            [
                                {
                                    text: 'View Contract',
                                    url: `https://etherscan.io/address/0x${tx.to}`
                                }
                            ]
                        ]
                    };
                    bot.telegram.sendMessage(-1001848648579, message, {
                        parse_mode: 'HTML',
                        reply_markup: replyMarkup
                    });
                }
                    break;

                default: {
                    const data = await queries.getRowFromApproves(tx.to);
                    if (data === undefined) break;
                    if (
                        tx.data.includes(data.token.slice(2))
                        && ((tx.to.toLowerCase() === '0x7a250d5630b4cf539739df2c5dacb4c659f2488d' ||
                            tx.to.toLowerCase() === '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD')
                            && tx.from !== data.deployer)
                    )
                        await queries.deleteToken(tx.to);
                    break;
                }
            }
        } catch (error) {
            console.log(error);
            continue
        }
    }
}

async function sendMessage(ctx, message) {
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

bot.launch()
