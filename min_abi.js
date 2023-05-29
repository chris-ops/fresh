const MIN_ABI = [    // name
{
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{ "name": "", "type": "string" }],
    "type": "function"
},
//symbol
{
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "name": "", "type": "string" }],
    "type": "function"
},
//totalSupply
{
    "constant": true,
    "inputs":[],
    "name":"totalSupply",
    "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability":"view",
    "type":"function"
},
//balanceOf
{
    "constant": true,
    "inputs": [
      {
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
,
//approve
{
    "constant": false,
    "inputs": [
      {
        "name": "_spender",
        "type": "address"
      },
      {
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
//decimals
{
  "constant": true,
  "inputs": [],
  "name": "decimals",
  "outputs": [
    {
      "internalType": "uint8",
      "name": "",
      "type": "uint8"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},
//owner
{
    "constant": true,
    "inputs": [],
    "name": "owner",
    "outputs": [{ "name": "", "type": "address" }],
    "type": "function"
},
//_owner
{
    "constant": true,
    "inputs": [],
    "name": "_owner",
    "outputs": [{ "name": "", "type": "address" }],
    "type": "function"
},
//Owner
{
    "constant": true,
    "inputs": [],
    "name": "Owner",
    "outputs": [{ "name": "", "type": "address" }],
    "type": "function"
},
//_Owner
{
    "constant": true,
    "inputs": [],
    "name": "_Owner",
    "outputs": [{ "name": "", "type": "address" }],
    "type": "function"
},
{
    "constant": true,
    "inputs": [],
    "name": "getOwner",
    "outputs": [{ "name": "", "type": "address" }],
    "type": "function"
},
//transfer
{    "inputs": [      {        "internalType": "address",        "name": "from",        "type": "address"      },      {        "internalType": "address",        "name": "to",        "type": "address"      },      {        "internalType": "uint256",        "name": "amount",        "type": "uint256"      }    ],
    "name": "_transfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
module.exports = MIN_ABI;