const { ethers } = require('ethers')
const utils = require('./utils.js')
const { Bot, InlineKeyboard } = require('grammy')
const { Menu } = require('@grammyjs/menu')
const queries = require('./queries.js')
const axios = require('axios')
const provider = new ethers.providers.WebSocketProvider('ws://127.0.0.1:8546');
const etherscanProvider = new ethers.providers.EtherscanProvider(
    'homestead',
    'ADITHDAHJGR15JV5FMB4C18JBVPINZ2UDP'
)
const MIN_ABI = require("./min_abi.js");

function calculateAverageTime(timestamps) {
    const totalTimestamps = timestamps.length;
    const sum = timestamps.reduce((acc, timestamp) => acc + timestamp, 0);

    return Math.floor(sum / totalTimestamps);
  }
const bot = new Bot('6141661523:AAGbHviqlwvdZ-8SRXfHJq7eBmyeeS93YUQ')

async function scanForFreshWallets(ctx, transaction) {
    try {
        let diff = 0
        if (transaction.to == null)
            return
        if (transaction.data.includes('8B3192f5eEBD8579568A2Ed41E6FEB402f93f73F'))
            return

        if (transaction.to.toLowerCase() == '0x7a250d5630b4cf539739df2c5dacb4c659f2488d'
            || transaction.to.toLowerCase() == '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad') {
            const nonce = await provider.getTransactionCount(transaction.from)
            etherscanProvider.getHistory(
                transaction.from,
                transaction.blockNumber - 10000,
                ).then((history) => {
                    const timestamps = history.map((tx) => tx.timestamp);
                    const averageTime = calculateAverageTime(timestamps);
                    //if averageTime is more than 1 day in unix time, add 1 to diff for each day
                    if (averageTime < Date.now() / 1000 - 86400) {
                        diff = Math.floor((Date.now() / 1000 - averageTime) / 86400);
                    }
            });

            if (nonce <= 5 || diff >= 1) {
                let title = getTitle(nonce, diff)
                let token = ''
                if (transaction.to.toLowerCase() == '0x7a250d5630b4cf539739df2c5dacb4c659f2488d')
                    token = await utils.parseTransactionV2(transaction.data)
                else if (transaction.to.toLowerCase() == '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad')
                    token = await utils.parseTransactionV3(transaction.data)
                const [marketCap, tokenName, pairAddress] = await utils.getMarketCapV2(ctx, token[1])
                if (marketCap > 200000) {
                    return
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
                    return
                //append text to title
                const message = `<b>${title}</b>\n${text}`
                sendMessage(ctx, message, pairAddress)
            }
        }
    } catch (error) {
        console.log(error)
        return
    }
}
function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

async function scanForApprovals(ctx, tx) {
    try {
        switch (tx.data.slice(0, 10)) {
            case '0x60806040': {
                let token = ''
                let tokenName = ''
                try {
                  token = tx?.creates || tx?.contractAddress || tx?.to;
                  tokenName = await this.utils.getTokenName(token)
                }
                catch (error) { console.log("Error getting token name: ", error) }
                await queries.addToTable(token, tokenName, tx.from);
                break;
            }
            case '0x095ea7b3': {
                const isInTable = await queries.getRowFromApproves(tx.to);
                if (isInTable === undefined) break;
                const [mcap, tokenname, pair] = await utils.getMarketCapV2(ctx, tx.to)
                if (mcap) break;
                const token = tx.to
                const request = `https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=${token}&apikey=ADITHDAHJGR15JV5FMB4C18JBVPINZ2UDP`
                const response = await axios.get(request)
                const deployer = response.data.result[0].contractCreator.toLowerCase()

                await queries.UpdateApproves(token, tokenname, deployer)
                // check if the token is in the key:pair isInTable

                const data = await queries.getRowFromApproves(token)
                if (data.skip < 3) {
                    queries.updateSkip(token)
                    return
                }

                const message = `${tokenname} | Approvals: ${data.approves}\nToken: <code>${token}</code>\nDeployer: <code>${data.deployer}</code>`

                // const menu = new Menu('root2').text(
                //     'Etherscan', `https://cn.etherscan.com/token/${token}`
                // ).text('Maestro', `https://t.me/MaestroSniperBot?start=${token}`)
                //     .text('Maestro Pro', `https://t.me/MaestroProBot?start=${token}`)
                //     .row().text('Dextools', `https://www.dextools.io/app/en/ether/pair-explorer/${pair}`)
                //     .text('Dexscreener', `https://dexscreener.com/ethereum/${pair}`)
                //     .text('Dexview', `https://www.dexview.com/eth/${token}`)
                const inlineKeyboard = new InlineKeyboard().url(
                    'Token', `https://cn.etherscan.com/token/${token}`
                ).url('Maestro', `https://t.me/MaestroSniperBot?start=${token}`)
                    .url('Maestro Pro', `https://t.me/MaestroProBot?start=${token}`)
                    .row().url('Dextools', `https://www.dextools.io/app/en/ether/pair-explorer/${pair}`)
                    .url('Dexscreener', `https://dexscreener.com/ethereum/${pair}`)
                    .url('Dexview', `https://www.dexview.com/eth/${token}`)
                    await ctx.reply(message, {
                        reply_markup: inlineKeyboard,
                        parse_mode: 'HTML'
                    })

                await queries.zeroSkip(token)
            }

                break

            default:
                const isInTable = await queries.getRowFromApproves(tx.to);
                if (isInTable === undefined) break;
                const token = tx.to
                const mcap = await utils.getMarketCapV2(ctx, token)
                if (mcap === undefined) break;
                await queries.deleteToken(tx.to);

                break

        }
    } catch (error) {
        console.log(error);
        return
    }
}

function getTitle(nonce, diff) {
    return diff >= 1
          ? nonce <= 5
            ? 'FRESH / DORMANT'
            : 'DORMANT'
          : nonce <= 5
          ? 'FRESH'
          : '';
}

async function sendMessage(ctx, message, pairAddress) {

    // const menu = new Menu('root').text(
    //     'Etherscan', `https://cn.etherscan.com/token/${ctx.tokenAddress}`
    // ).text('Maestro', `https://t.me/MaestroSniperBot?start=${ctx.tokenAddress}`)
    //     .text('Maestro Pro', `https://t.me/MaestroProBot?start=${ctx.tokenAddress}`)
    //     .row().text('Dextools', `https://www.dextools.io/app/en/ether/pair-explorer/${pairAddress}`)
    //     .text('Dexscreener', `https://dexscreener.com/ethereum/${pairAddress}`)
    //     .text('Dexview', `https://www.dexview.com/eth/${ctx.tokenAddress}`)
    const inlineKeyboard = new InlineKeyboard().url(
        'Etherscan', `https://cn.etherscan.com/token/${ctx.tokenAddress}`
    ).url('Maestro', `https://t.me/MaestroSniperBot?start=${ctx.tokenAddress}`)
        .url('Maestro Pro', `https://t.me/MaestroProBot?start=${ctx.tokenAddress}`)
        .row().url('Dextools', `https://www.dextools.io/app/en/ether/pair-explorer/${pairAddress}`)
        .url('Dexscreener', `https://dexscreener.com/ethereum/${pairAddress}`)
        .url('Dexview', `https://www.dexview.com/eth/${ctx.tokenAddress}`)

        await ctx.reply(message, {
            reply_markup: inlineKeyboard,
            parse_mode: 'HTML'
        })
}
//create function to get pending transactions
const scan = (async (ctx) => {
    //if the command message was not sent by the bot owner, ignore the message
    if (ctx.message.from.id != 2129042539)
        return
    console.log('start')
    ctx.reply('summoning darkness')
    // ctx.chat.id = -1001848648579
    provider.on('pending', async (hash) => {
        try {
            const transaction = await provider.getTransaction(hash)
                await scanForFreshWallets(ctx, transaction)
                await scanForApprovals(ctx, transaction)
        } catch (error) {
            console.log('CRITICAL: ', error)
        }
    })
})

bot.command('summondarkness', scan)
bot.start()