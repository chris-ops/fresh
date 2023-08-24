const { ethers } = require('ethers')
const utils = require('./utils.js')
const { Bot, InlineKeyboard } = require('grammy')
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
const bot = new Bot('5787240482:AAF_OHRj3-UyUHR6vEbMN0GOl-HCsulajxc')

async function scanForFreshWallets(transaction) {
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
                try {
                    if (transaction.to.toLowerCase() == '0x7a250d5630b4cf539739df2c5dacb4c659f2488d')
                    token = await utils.parseTransactionV2(transaction)
                else if (transaction.to.toLowerCase() == '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad')
                    token = await utils.parseTransactionV3(transaction)  
                } catch (error) {
                    console.log('error parsing transaction: ' + error)
                }
                console.log('token: ', token)
                const [marketCap, tokenName, pairAddress] = await utils.getMarketCapV2(token[1])
                if (marketCap > 200000) {
                    return
                }
                console.log(marketCap, tokenName, pairAddress)
                let marketCapString = ''
                try {
                    marketCapString = utils.parseMarketCap(marketCap?.toString())
                    
                } catch (error) {
                    return
                }
                const tokenObject = {
                    tokenName: token[0],
                    tokenAddress: token[1],
                    walletAddress: transaction.from,
                }
                const text = await utils.mount_text(
                    tokenObject,
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
                const inlineKeyboard = new InlineKeyboard().url(
                    'Etherscan', `https://cn.etherscan.com/token/${tokenObject.tokenAddress}`)
                    .url('Wallet', `https://cn.etherscan.com/address/${tokenObject.walletAddress}`)
                    .url('Maestro', `https://t.me/MaestroSniperBot?start=${tokenObject.tokenAddress}`)
                    .url('Maestro Pro', `https://t.me/MaestroProBot?start=${tokenObject.tokenAddress}`)
                    .row().url('Dextools', `https://www.dextools.io/app/en/ether/pair-explorer/${pairAddress}`)
                    .url('Dexscreener', `https://dexscreener.com/ethereum/${pairAddress}`)
                    .url('Dexview', `https://www.dexview.com/eth/${tokenObject.tokenAddress}`)
            
                    await bot.api.sendMessage(-1001848648579, message, {
                        reply_markup: inlineKeyboard,
                        parse_mode: 'HTML'
                    })
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

async function scanForApprovals(tx) {
    try {
        switch (tx.data.slice(0, 10)) {
            case '0x60806040': {
                let token = ''
                let tokenName = ''
                try {
                  token = tx?.creates || tx?.contractAddress || tx?.to;
                  tokenName = await utils.getTokenName(token)
                }
                catch (error) { console.log("Error getting token name: ", error) }
                await queries.addToTable(token, tokenName, tx.from, tx.blockNumber);
                break;
            }
            case '0x095ea7b3': {
                const isInTable = await queries.getRowFromApproves(tx.to);
                if (isInTable === undefined) break;
                const [mcap, tokenname, pair] = await utils.getMarketCapV2(tx.to)
                if (mcap) break;
                const token = tx.to
                // const mincontract = new ethers.Contract(token, MIN_ABI, provider)
                // const promises = [
                //     mincontract.owner(),
                //     mincontract._owner(),
                //     mincontract.Owner(),
                //     mincontract._Owner(),
                // ]
    
                // let deployer = ''
    
                // const runPromises = async () => {
                //     try {
                //         deployer = await Promise.race(promises)
                //     } catch (error) {
                //         console.log(error)
                //     }
                // }
    
                // runPromises()

                await queries.UpdateApproves(token)
                // check if the token is in the key:pair isInTable

                const data = await queries.getRowFromApproves(token)
                if (data.skip < 3) {
                    queries.updateSkip(token)
                    return
                }

                const message = `${data.tokenname} | Approvals: ${data.approves}\nToken: <code>${token}</code>\nDeployer: <code>${data.deployer}</code>`

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
                    await bot.api.sendMessage(-1001848648579, message, {
                        reply_markup: inlineKeyboard,
                        parse_mode: 'HTML'
                    })

                await queries.zeroSkip(token)
            }

                break

            case '0xf305d719':{
                const splitData = utils.splitStringV2(tx.data)
                let token = splitData[0]
                //remove leading characters until 38 characters left
                token = `0x${token.slice(24, 64)}`
                const creationBlock = await queries.getCreatedAt(token);
                const diff = Math.floor((tx.blockNumber - creationBlock));
                if (diff < 10) {
                    const [mcap, tokenname, pair] = await utils.getMarketCapV2(tx.to)
                    const inlineKeyboard = new InlineKeyboard().url(
                        'Token', `https://cn.etherscan.com/token/${token}`
                    ).url('Maestro', `https://t.me/MaestroSniperBot?start=${token}`)
                        .url('Maestro Pro', `https://t.me/MaestroProBot?start=${token}`)
                        .row().url('Dextools', `https://www.dextools.io/app/en/ether/pair-explorer/${pair}`)
                        .url('Dexscreener', `https://dexscreener.com/ethereum/${pair}`)
                        .url('Dexview', `https://www.dexview.com/eth/${token}`)
                    bot.api.sendMessage(-1001848648579, `Fast launch: <code>${token}</code>` , {
                        reply_markup: inlineKeyboard,
                        parse_mode: 'HTML'
                    })
                    bot.api.sendMessage(-970024743, `Fast launch: <code>${token}</code>` , {
                        reply_markup: inlineKeyboard,
                        parse_mode: 'HTML'
                    })
                }
            }
                break
            default:
                const isInTable = await queries.getRowFromApproves(tx.to);
                if (isInTable === undefined) break;
                const token = tx.to
                const mcap = await utils.getMarketCapV2(token)
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

//create function to get pending transactions
const scan = _ => {
    console.log('scanning')
    //if the command message was not sent by the bot owner, ignore the message
    // ctx.chat.id = -1001848648579
    provider.on('block', async (block) => {
        try {
            const blockWithTransactions = await provider.getBlockWithTransactions(block)
            for (const transaction of blockWithTransactions.transactions) {
                await scanForFreshWallets(transaction)
                await scanForApprovals(transaction)
            }
        } catch (error) {
            console.log('CRITICAL: ', error)
        }
    })
}

bot.start()
scan()