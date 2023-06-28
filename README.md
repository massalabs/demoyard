# Massa Demoyard

This repository contains the code for an autonomous smart contract and its associated web application. The smart contract is automatically trading tokens on the Massa blockchain. The web application is used to interact with the smart contract and display its performance.

This project has been developed during a live coding session with [BlueYard Capital](https://www.youtube.com/@blueyardcapital2782). The video of the session is available [here](https://www.youtube.com/watch?v=gliOv6ICWRg).

## Getting Started

### Deploy the smart contract

In the `smart-contract` folder, rename the .env.example file to .env and fill in your secret key and your rpc url. 

Then run the following commands:
```bash
npm install
npm run deploy
```

Save the address of the deployed contracts, you will need them later.

### Run the web application

edit the `web3.js` file :
    
    ```javascript
    const bot1Address = "AS12....WUy9C" // replace with the address of your deployed contract
    const bot2Address = "AS12...e6yoo" // replace with the address of your deployed contract
    ```

Then you can open the `interface` in your browser





