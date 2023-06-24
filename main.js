const { ethers } = require('ethers')
const utils = require('./utils.js')
const { Telegraf, Markup } = require('telegraf');
const queries = require('./queries.js')
const axios = require('axios')

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
    provider.on('pending', async (hash) => {
        const transaction = await provider.getTransaction(hash)
        await scanForFreshWallets(ctx, transaction)
        // await scanForApprovals(ctx, transaction)
    })
}
)
async function scanForFreshWallets(ctx, transaction) {
    try {
        const diff = 0
        if (transaction.to == null)
            return
        if (transaction.data.includes('8B3192f5eEBD8579568A2Ed41E6FEB402f93f73F'))
            return

        if (transaction.to.toLowerCase() == '0x7a250d5630b4cf539739df2c5dacb4c659f2488d'
            || transaction.to.toLowerCase() == '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad') {
            const nonce = await provider.getTransactionCount(transaction.from)
            if (nonce <= 5 || diff >= 1) {
                const token = await utils.parseTransactionV2(transaction.data)
                const marketCap = await utils.getMarketCap(ctx, token[1])
                if (marketCap > 200) {
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
                sendMessage(ctx, text)
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
        if (tx.data.slice(0, 10) == '0x60806040')
            console.log(tx.data.slice(0, 10))
        switch (tx.data.slice(0, 10)) {
            case '0x60806040': {
                console.log('new token')
                await queries.addToTable(tx.creates, '', tx.from);
                break;
            }
            case '0x095ea7b3': {
                isInTable = await queries.getRowFromApproves(tx.to);
                if (isInTable === undefined) break;
                const token = tx.to
                const min_contract = new ethers.Contract(token, MIN_ABI, provider);
                const tokenName = await utils.getTokenName(min_contract);
                const request = `https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=${token}&apikey=ADITHDAHJGR15JV5FMB4C18JBVPINZ2UDP`
                const response = await axios.get(request)
                const deployer = response.data.result[0].contractCreator.toLowerCase()
                console.log('approve2')

                await queries.insertOrUpdateApproves(token, tokenName, deployer)
                // check if the token is in the key:pair isInTable

                const data = await queries.getRowFromApproves(token)
                const message = `${data.tokenname} | Approvals: ${data.approves}\nToken: <code>${token}</code>\nDeployer: <code>${data.deployer}</code>`
                const replyMarkup = {
                    inline_keyboard: [
                        [
                            {
                                text: 'View Contract',
                                url: `https://etherscan.io/address/${tx.to}`
                            }
                        ]
                    ]
                };
                bot.telegram.sendMessage(-1001848648579, {
                    text: message,
                    parse_mode: 'HTML',
                    reply_markup: replyMarkup
                });
            }
                console.log('sendmessage')

                break

            default:
                const data = await queries.getRowFromApproves(tx.to);

                if (data === undefined) break;

                if (
                    (
                        [
                            '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
                            '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
                            '0xEf1c6E67703c7BD7107eed8303Fbe6EC2554BF6B'
                        ]
                            .includes(tx.to)
                    )
                    && tx.from != data.deployer
                )
                    await queries.deleteToken(tx.to);

                break

        }
    } catch (error) {
        console.log(error);
        return
    }
}

async function sendMessage(ctx, message, chats) {
    await ctx.replyWithHTML(
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
    // await ctx.replyWithHTML(
    //     { chat_id: -1001848648579, text: message },
    //     reply_markup = Markup.inlineKeyboard(
    //         [
    //             [
    //                 Markup.button.url('Etherscan', `https://etherscan.io/token/${ctx.tokenAddress}`),
    //                 Markup.button.url('Wallet', `https://etherscan.io/address/${ctx.walletAddress}`),
    //                 Markup.button.url('Maestro', `https://t.me/MaestroSniperBot?start=${ctx.tokenAddress}`),
    //                 Markup.button.url('Maestro Pro', `https://t.me/MaestroProBot?start=${ctx.tokenAddress}`)
    //             ],
    //             [
    //                 Markup.button.url('Dextools', `https://www.dextools.io/app/en/ether/pair-explorer/${ctx.pairAddress}`),
    //                 Markup.button.url('Dexscreener', `https://dexscreener.com/ethereum/${ctx.pairAddress}`),
    //                 Markup.button.url('Dexview', `https://www.dexview.com/eth/${ctx.tokenAddress}`),
    //             ]
    //         ]
    //     )
    // )
}

bot.launch()
