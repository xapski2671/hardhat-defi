// a script to automate getting wrapped eth WETH
const { getNamedAccounts, ethers } = require("hardhat")

const AMOUNT = ethers.utils.parseEther("0.02")

async function getWeth()
{
  const { deployer } = await getNamedAccounts()
  // call the deposit function on the weth contract
  // how do we get the contract, we need an abi and an address
  // the weth abi is similar to that of any erc20, just with the part where it converts eth
  // to get an abi, compiling an interface of the contract will do
  // 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2  this address is that of weth mainnet
  const iWeth = await ethers.getContractAt("IWeth", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", deployer)
  // i get the weth contract as iWeth and i say that the deployer is the eoa calling the contract
  const tx = await iWeth.deposit({ value: AMOUNT })
  await tx.wait(1) 
  const wethBalance = await iWeth.balanceOf(deployer) // my weth balance
  console.log(`Got ${wethBalance.toString()} WETH`)
}

module.exports = { getWeth, AMOUNT }
