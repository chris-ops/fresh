const { ethers } = require("ethers");
const MIN_ABI = require("./min_abi.js");
const provider = new ethers.providers.JsonRpcProvider('https://rpc.flashbots.net/');
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const queries = require('./queries.js')
const axios = require('axios')
const UNISWAP_FACTORY_ABI = require("./uniswap_factory_abi.js");
const UNISWAP_PAIR_ABI = require("./uniswap_pair_abi.js");
const UNISWAP_FACTORY_ADDRESS = require("./uniswap_factory_address.js");
const UNISWAP_ROUTER_ABI = require("./uniswap_router_abi.js");
const UNISWAP_V3 = require("./uniswap_v3.js");

const bignumber = require('bignumber.js')

const INTERFACE_UNISWAP_V2 = new ethers.utils.Interface(UNISWAP_ROUTER_ABI)
const INTERFACE_UNISWAP_V3 = new ethers.utils.Interface(UNISWAP_V3)

async function mount_text(ctx, tokenName, tokenAddress, from, nonce, marketCapString, diff) {
  queries.createOrUpdate(tokenAddress)
  const amount = await queries.queryAmount(tokenAddress)
  if (amount > 5)
    return 0
  return `${ctx.tokenName} | ${marketCapString} | <b>#${amount}</b>\n\nToken: <code>${ctx.tokenAddress}</code>\nWallet: <code>${from}</code>\nDays inactive: ${diff}\nTransactions: ${nonce}`
}

async function getMarketCapV2(ctx, token) {
  const resultPrice = await axios.post(`https://api.dexscreener.io/latest/dex/tokens/${token}`)
  //if pairs exist, get fdv
  if (resultPrice.data.pairs) {
    const {pairAddress} = resultPrice.data.pairs[0]
    const tokenName = `${resultPrice.data.pairs[0].baseToken.name} (${resultPrice.data.pairs[0].baseToken.symbol})` 
    return [resultPrice.data.pairs[0].fdv, tokenName, pairAddress]
  }
  return [undefined, undefined, undefined]
}

async function getMarketCap(tokenA) {
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
  // ctx.pairAddress = liquidityPoolAddress
  // Create an instance of the UniswapV2Pair contract
  const liquidityPool = new ethers.Contract(
    liquidityPoolAddress,
    UNISWAP_PAIR_ABI,
    provider
  );
  // Get the liquidity pool address for the given token pair
  const minContract = new ethers.Contract(tokenA, MIN_ABI, provider)
  // Get the total liquidity in the pool
  const bnLiquidity = await liquidityPool.getReserves();
  const decimals = await minContract.decimals()
  const token0 = await liquidityPool.token0()
  const which = token0.toLowerCase() != WETH_ADDRESS
  const nLiquidity = which ? ethers.utils.formatEther(bnLiquidity[0]) : ethers.utils.formatEther(bnLiquidity[1])

  const pricePerETH = which ? parseFloat(ethers.utils.formatUnits(bnLiquidity[1], decimals)) / (parseFloat(ethers.utils.formatEther(bnLiquidity[0])))
    :
    parseFloat(ethers.utils.formatEther(bnLiquidity[0])) / (parseFloat(ethers.utils.formatUnits(bnLiquidity[1], decimals)))

  console.log(pricePerETH)
  const totalSupply = ethers.utils.formatUnits(await minContract.totalSupply(), decimals)
  const mc = totalSupply * (pricePerETH) * 1900
  return mc.toString()
}

function parseMarketCap(marketCap) {
  //use the number of digits to format it properly
  //if 4 digits, divide by 1000 with 1 decimal and add k
  //and so on for m, b, t
  const digits = marketCap.toString().length
  if (digits < 4)
    return marketCap
  if (digits < 7)
    return `${(marketCap / 1000).toFixed(1)}k`
  if (digits < 10)
    return `${(marketCap / 1000000).toFixed(1)}m`
  if (digits < 13)
    return `${(marketCap / 1000000000).toFixed(1)}b`
  if (digits < 16)
    return `${(marketCap / 1000000000000).toFixed(1)}t`

  return marketCap
}

async function getTokenName(minContract) {
  const name = await minContract.name()
  const symbol = await minContract.symbol()
  return `${name} (${symbol})`
}

async function parseTransactionV2(data) {
  let match = INTERFACE_UNISWAP_V2.parseTransaction({ data: data })
  let token = match.args.path[1]
  if (token.toLowerCase() == WETH_ADDRESS)
    return

  let minContract = new ethers.Contract(token, MIN_ABI, provider)
  let tokenName = await getTokenName(minContract)
  return [tokenName, token]
}
async function parseTransactionV3(data) {
  let match = INTERFACE_UNISWAP_V3.parseTransaction({ data: data })
  let token = match.args.path[1]
  if (token.toLowerCase() == WETH_ADDRESS)
    return

  let minContract = new ethers.Contract(token, MIN_ABI, provider)
  let tokenName = await getTokenName(minContract)
  return [tokenName, token]
}

function unixTimeToDays(unixTime) {
  const date = new Date(unixTime * 1000);
  const today = new Date();
  const timeDiff = date.getTime() - today.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  return daysDiff.toString();
}

//export all functions
module.exports = {
  mount_text,
  getTokenName,
  parseTransactionV2,
  unixTimeToDays,
  getMarketCapV2,
  parseMarketCap,
}
