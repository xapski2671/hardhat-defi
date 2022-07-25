const { getNamedAccounts, ethers } = require("hardhat")
const { getWeth, AMOUNT } = require("./getWeth")

async function main()
{
  // we convert our eth to weth so its ready for depositing
  await getWeth()
  const { deployer } = await getNamedAccounts()

  // Lending Pool Address Provider 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
  // we get Lending Pool contract address from the provider
  const lendingPool = await getLendingPool(deployer)
  console.log(`LendingPool address ${lendingPool.address}`)

  // we deposit into aave
  // to transfer er20 tokens we must use the aprove func to allow aave collect our deposit
  const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  // approve lending to aave
  await approveERC20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)
  console.log("Depositing...")
  // aave deposit function
  // function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)
  await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
  console.log("Deposited")

  // Borrowing
  let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(lendingPool, deployer)
  const daiPrice = await getDAIPrice()
  const amountDAIToBorrow = availableBorrowsETH.toString() * 0.95 * (1/(daiPrice.toNumber()))  
  // 0.95 cuz i'm not trying to borrow my entire borrowing limit
  console.log(`You can borrow ${amountDAIToBorrow} DAI`)
  const amountDAIToBorrowWei = ethers.utils.parseEther(amountDAIToBorrow.toString())
  // i.e. dai amount in 18 decimal places not converted to or in terms of wei
  console.log(amountDAIToBorrowWei.toString())

  const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
  await borrowDAI(daiTokenAddress, lendingPool, amountDAIToBorrowWei, deployer)
  await getBorrowUserData(lendingPool, deployer) // to see our new status

  //repaying
  await repay(amountDAIToBorrowWei, daiTokenAddress, lendingPool, deployer)
  await getBorrowUserData(lendingPool, deployer)
}

async function getBorrowUserData(lendingPool, account)
{
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } = await lendingPool.getUserAccountData(account)
  console.log(`You have ${totalCollateralETH} worth of ETH deposited.`)
  console.log(`You have ${totalDebtETH} worth of ETH borrowed`)
  console.log(`You can borrow ${availableBorrowsETH} worth of ETH borrowed`)
  return { availableBorrowsETH, totalDebtETH }
}

async function getLendingPool(account)
{
  const lendingPoolAddressesProvider = await ethers.getContractAt("ILendingPoolAddressesProvider", 
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5", 
    account
  ) // the lending pool address provider contract
  const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool() // the lending pool contract address
  const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account) // the lending pool contract
  return lendingPool
}

async function approveERC20(erc20Address, spenderAddress, amountToSpend, account)
{
  // we use the default erc20 standard interface  (not that of weth) but we use weth contract address cuz its compatible
  // and that's where our money is
  const erc20Token = await ethers.getContractAt("IERC20", erc20Address, account)
  const tx = await erc20Token.approve(spenderAddress, amountToSpend)
  await tx.wait(1)
  console.log("Approved!")
}

async function getDAIPrice()
{
  const daiEthPriceFeedAddress = "0x773616E4d11A78F511299002da57A0a94577F1f4"
  const daiEthPriceFeed = await ethers.getContractAt("AggregatorV3Interface", daiEthPriceFeedAddress)
  // this is a read call, so we don't need 'deployer' or any account to sign 
  const price = (await daiEthPriceFeed.latestRoundData())[1] // we only need the price so we choose the return item at index 1 (price)
  console.log(`The DAI/ETH price is ${price.toString()}`)
  return price
}

async function borrowDAI(daiAddress, lendingPool, amountDAIToBorrowWei, account)
{
  // aave borrow func function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)
  const borrowTx = await lendingPool.borrow(daiAddress, amountDAIToBorrowWei, 1, 0, account)
  await borrowTx.wait(1)
  console.log("You've borrowed")
}

async function repay(amount, daiAddress, lendingPool, account)
{
  await approveERC20(daiAddress, lendingPool.address, amount, account)
  // aave repay func function repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf)
  const repayTx = await lendingPool.repay(daiAddress, amount, 1, account)
  await repayTx.wait(1)
  console.log("Repaid!!")
}


main()
  .then(()=>process.exit(0))
  .catch((error)=>
  {
    console.log(error)
    process.exit(1)
  })