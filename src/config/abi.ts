// Replace the array below with your actual ABI from DeferswapPool.sol
export const poolAbi = [{"inputs":[{"internalType":"address","name":"_quoteToken","type":"address"},{"internalType":"address","name":"_baseToken","type":"address"},{"internalType":"address","name":"_marketMaker","type":"address"},{"internalType":"address","name":"_priceFeed","type":"address"},{"internalType":"uint256","name":"_minQuoteSize","type":"uint256"},{"internalType":"uint256","name":"_settlementPeriod","type":"uint256"},{"internalType":"uint256","name":"_penaltyRate","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newMinQuoteSize","type":"uint256"}],"name":"MinQuoteSizeUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferStarted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newPenaltyRate","type":"uint256"}],"name":"PenaltyRateUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"oldPriceFeed","type":"address"},{"indexed":false,"internalType":"address","name":"newPriceFeed","type":"address"}],"name":"PriceFeedUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"swapId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"maxQuoteSize","type":"uint256"}],"name":"QuotePosted","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"RescueERC20","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newSettlementPeriod","type":"uint256"}],"name":"SettlementPeriodUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"swapId","type":"uint256"}],"name":"SwapCancelled","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"swapId","type":"uint256"},{"indexed":false,"internalType":"bool","name":"wasSettled","type":"bool"}],"name":"SwapClaimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"swapId","type":"uint256"}],"name":"SwapSettled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"swapId","type":"uint256"},{"indexed":false,"internalType":"address","name":"swapper","type":"address"},{"indexed":false,"internalType":"uint256","name":"quoteAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"baseAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"expiry","type":"uint256"}],"name":"SwapTaken","type":"event"},{"inputs":[],"name":"BASE_TOKEN_DECIMALS","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MAX_SIZE_TIERS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"QUOTE_TOKEN_DECIMALS","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"acceptOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"baseToken","outputs":[{"internalType":"contract IERC20Metadata","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"swapId","type":"uint256"}],"name":"cancelSwap","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"swapId","type":"uint256"}],"name":"claimSwap","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"swapId","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"getEffectivePriceWithSpread","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOraclePrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"marketMaker","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"minQuoteSize","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"penaltyRate","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pendingOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"priceFeed","outputs":[{"internalType":"contract IChainlinkAggregator","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256[]","name":"newSpreads","type":"uint256[]"},{"internalType":"uint256[]","name":"newSizeTiers","type":"uint256[]"}],"name":"quote","outputs":[{"internalType":"uint256","name":"swapId","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"quoteToken","outputs":[{"internalType":"contract IERC20Metadata","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"address","name":"recipient","type":"address"}],"name":"rescueERC20","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_minQuoteSize","type":"uint256"}],"name":"setMinQuoteSize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_penaltyRate","type":"uint256"}],"name":"setPenaltyRate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_newPriceFeed","type":"address"}],"name":"setPriceFeed","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_settlementPeriod","type":"uint256"}],"name":"setSettlementPeriod","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"swapId","type":"uint256"}],"name":"settleSwap","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"settlementPeriod","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"swapCounter","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"swaps","outputs":[{"internalType":"address","name":"swapper","type":"address"},{"internalType":"uint256","name":"quoteAmount","type":"uint256"},{"internalType":"uint256","name":"baseAmount","type":"uint256"},{"internalType":"uint256","name":"maxQuoteSize","type":"uint256"},{"internalType":"uint256","name":"collateral","type":"uint256"},{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"bool","name":"taken","type":"bool"},{"internalType":"bool","name":"settled","type":"bool"},{"internalType":"bool","name":"claimed","type":"bool"},{"internalType":"bool","name":"cancelled","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"quoteAmount","type":"uint256"},{"internalType":"uint256","name":"minBaseAmount","type":"uint256"}],"name":"takeSwap","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"takenSwaps","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]