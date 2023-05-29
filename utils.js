const { ethers } = require("ethers");
const MIN_ABI = require("./min_abi.js");
const UNISWAP_FACTORY_ABI = require("./uniswap_factory_abi.js");
const UNISWAP_PAIR_ABI = require("./uniswap_pair_abi.js");
const UNISWAP_FACTORY_ADDRESS = require("./uniswap_factory_address.js");
const UNISWAP_ROUTER_ABI = require("./uniswap_router_abi.js");
const provider = new ethers.providers.JsonRpcProvider('https://rpc.flashbots.net/');
const xeth = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const random_wallet = '0x764d5850fdd0a99de0b3b2a568d3014adf2e0f6b'

const router = new ethers.Contract(
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  UNISWAP_ROUTER_ABI,
  provider
);
const INTERFACE_UNISWAP = new ethers.utils.Interface(UNISWAP_ROUTER_ABI)


// async function getLiquidity(tokenA) {
//   // Connect to the Ethereum network
//   // Create an instance of the UniswapV2Factory contract
//   const factory = new ethers.Contract(
//     UNISWAP_FACTORY_ADDRESS,
//     UNISWAP_FACTORY_ABI,
//     provider
//   );

//   const liquidityPoolAddress = await factory.getPair(tokenA, xeth);
//   if (liquidityPoolAddress == ethers.constants.AddressZero)
//     return 0
//   // Create an instance of the UniswapV2Pair contract
//   const liquidityPool = new ethers.Contract(
//     liquidityPoolAddress,
//     UNISWAP_PAIR_ABI,
//     provider
//   );
//   // Get the liquidity pool address for the given token pair
//   let minContract = new ethers.Contract(tokenA, MIN_ABI, provider)
//   // Get the total liquidity in the pool
//   const bnLiquidity = await liquidityPool.getReserves();
//   let token0 = await liquidityPool.token0()
//   let which = token0.toLowerCase() != xeth
//   let nLiquidity = which ? ethers.utils.formatEther(bnLiquidity[0]) : ethers.utils.formatEther(bnLiquidity[1])

//   let pricePerETH = which ? parseFloat(ethers.utils.formatEther(bnLiquidity[0])) / (parseFloat(ethers.utils.formatEther(bnLiquidity[1])))
//     :
//     parseFloat(ethers.utils.formatEther(bnLiquidity[1])) / (parseFloat(ethers.utils.formatEther(bnLiquidity[0])))

//   let totalSupply = ethers.utils.formatEther(await minContract.totalSupply())
//   let mc = totalSupply * (pricePerETH) * 1900 / 100

//   return [pricePerETH, (Math.round(nLiquidity * 100) / 100), mc.toString()]
//   // return (Math.round(nLiquidity * 100) / 100)
// }

// function getLiquidityFallback(data) {
//   console.log('function', data)
//   let liqeth = splitString(data)
//   liqeth = ethers.utils.formatEther(liqeth[3].toString())
//   return liqeth
// }

// async function getMaxWallet(token) {
//   let minContract = new ethers.Contract(token, MIN_ABI, provider)
//   let totalSupply = await minContract.totalSupply()
//   let decimals = await minContract.decimals()
//   let parsedSupply = ethers.utils.formatEther(totalSupply, decimals)
//   //create an array of percentages from 0 to 100, including half percentages, excluding 0
//   const percentages = [];
//   const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

//   for (let i = 1; i <= 5; i += 1) {
//     let value = parseInt((parseInt(parsedSupply) / 2)).toString()
//     console.log(percentages[1])
//     console.log('bbbbbbbbb')
//     percentages.push(value);
//   }
//   //for each percentage, calculate the amount in tokens and push to an array
//   // tenderly.simulateMaxWallet(token, percentages)
//   let INTERFACE_UNISWAP = new ethers.utils.Interface(UNISWAP_ROUTER_ABI)
//   const path = [xeth, token]; // Swap from ETH to the token
//   for (let i = 0; i < percentages.length; i++) {
//     let dataTX = INTERFACE_UNISWAP.encodeFunctionData("swapETHForExactTokens", [
//       percentages[i], path, random_wallet, deadline
//     ])
//     let txObjectEIP1559 = {
//       to: router.address,
//       from: random_wallet,
//       data: dataTX,
//       value: ethers.utils.parseEther('100'),
//     }
//     try {
//       let tx = await provider.call(txObjectEIP1559)
//       return true
//     } catch (error) {
//       return false
//     }
//   }
// }

// async function getOwner(contract) {
//   let backwards = await provider.getBlockNumber() - 128
//   const filter = {
//     fromBlock: backwards,
//     address: contract,
//   };
//   // Search for logs that match the filter criteria
//   await provider.getLogs(filter).then(async logs => {
//     // Iterate through the logs to find the contract creation transaction
//     for (let i = 0; i < logs.length; i++) {
//       let txReceipt = await provider.getTransactionReceipt(logs[i].transactionHash);
//       try {
//         if (txReceipt.data.includes('0x60c06040'))
//           return txReceipt.from
//       } catch (error) {
//         continue
//       }
//     }
//   }).catch(error => {
//     console.log(error);
//   });
//   return '0x0'
// }

// async function getPair(tokenA, tokenB) {
//   return await factory.getPair(tokenA, tokenB)
// }

// function hexToDecimal(hex) {
//   return parseInt(hex, 16);
// }

// function splitString(str) {
//   const rest = str.slice(10);
//   const chunks = [];

//   for (let i = 0; i < rest.length; i += 64) {
//     const chunk = rest.slice(i, i + 64);
//     const decimalChunk = hexToDecimal(chunk);
//     chunks.push(decimalChunk);
//   }

//   return chunks;
// }

// function unixTimeToDays(unixTime) {
//   const millisecondsPerDay = 86400000;
//   const days = Math.floor(unixTime / millisecondsPerDay);
//   return days.toString();
// }

// async function staticTransaction(token, amountsOut) {
//   const amountIn = ethers.utils.parseEther('1'); // 1 ETH
//   const path = [WETH_ADDRESS, TOKEN_ADDRESS]; // WETH -> Token
//   const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

//   // simulate the swap to get the expected output amount

//   const recipient = '0xMyRecipientAddress';

//   // create the swap transaction
//   const tx = await router.callStatic.swapETHForExactTokens(
//     amountsOut,
//     path,
//     recipient,
//     deadline,
//     { value: amountIn }
//   );
// }


async function getTokenName(contract, minContract) {
  let name = await minContract.name()
  let symbol = await minContract.symbol()
  return `${name} (${symbol})`
}

async function parseTransaction(data) {
    let match = INTERFACE_UNISWAP.parseTransaction({ data: data })
    let token = match.args.path[1]
    if (token.toLowerCase() == xeth)
        return

    let minContract = new ethers.Contract(token, MIN_ABI, provider)
    let tokenName = await getTokenName(token, minContract)
    return [tokenName, token]
}

//export all functions
module.exports = {
  getTokenName,
  parseTransaction
}
