# Demo of a trading bot

This demo was originally made for a [presentation with BlueYard](https://www.youtube.com/watch?v=gliOv6ICWRg) where you can see a full live code of this project.

This project regroup 2 trading bots and a html interface.
The first trading bot is a very simple that buy/sell when a certain price is reached.
The second trading bot is a bot that calculate a RSI and buy/sell using this indicator.

This project is a great example of a fully-working project with SC side (using autonomous SC) and the 
interface side.
You can use it as a starting point but be careful there is a lot of security problems in it as it's a demo project.

You will find the smart contract side under `smart-contracts/` where you can build and deploy the contracts yourself.

The interface is located in `interface/` and is linked to already deployed smart contracts on the buildnet.

This project use the pools provided by Dusa you can visualize the one used on this project [here](https://trading.dusa.io/pools/AS12XdqMFYx1Ghd5LRzMq9hw81hVgBAYX9zqMJVZeVyM9nRn4C2pt/AS1dJ8mrm2cVSdZVZLXo43wRx5FxywZ9BmxiUmXCy7Tx72XNbit8/100)

If you need any help on this example feel free to open an issue or ask on our discord.