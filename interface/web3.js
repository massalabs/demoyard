// create a base account for signing transactions
const baseAccount = {
    address: "AU1S1nYswWaHs3ySqnW9D9ZZYdbGH9NEXGQVQDZpUZ9ptJse56aW",
    secretKey: "S124xpCaad7hPhvezhHp2sSxb56Dpi2oufcp2m2NtkdPjgxFXNon",
    publicKey: "P1zir4oncNbkuQFkZyU4TjfNzR5BotZzf4hGVE4pCNwCb6Z2Kjn",
};

const bot1Address = "AS12SQQD4ztu3sw35km2EV4Cx4GCJJQqabrzAZfMi3N6eNBfWUy9C"
const bot2Address = "AS128cj1yZu3wH7YNEPB35H8f5ev4FquizbfXiaKvhe2118Ze6yoo"
const priceVariationAddress = "AS12mLNuMh4xr4fynEUK2aqsLNg2uKRBsbXaoxbiXwQPAYDFaWRfk"
const debugAddress = "AS1vCSB3f1XsV1HyrK7FrpPADGvB9T78oPcDAzWvA45mYmYimr4s"
const USDCAddress = "AS1dJ8mrm2cVSdZVZLXo43wRx5FxywZ9BmxiUmXCy7Tx72XNbit8";
const WMASAddress = "AS12XdqMFYx1Ghd5LRzMq9hw81hVgBAYX9zqMJVZeVyM9nRn4C2pt";
const OneUnit = BigInt(10 ** 9);

// initialize a custom client using an own provider
const providers = [
    {
        url: "http://149.202.84.7:33035",
        type: window.massa.ProviderType.PUBLIC,
    },
    {
        url: "http://149.202.84.7:33034",
        type: window.massa.ProviderType.PRIVATE,
    },
    {
        url: "ws://149.202.84.7:33036",
        type: window.massa.ProviderType.WS,
    }
];

let web3Client = undefined;
let balanceBot1 = undefined;
let balanceBot2 = undefined;


massa.ClientFactory.createCustomClient(
    providers,
    true,
    baseAccount
).then((client) => {
    client.publicApi()
    .getNodeStatus().then((status) => {
        const eventsFilter = {
            start: status.last_slot,
            end: null,
            original_caller_address: null,
            original_operation_id: null,
            emitter_address: null,
        };
        web3Client = client;
        const eventPoller = window.massa.EventPoller.startEventsPolling(
            eventsFilter,
            1000,
            web3Client
        );
        eventPoller.on(window.massa.ON_MASSA_EVENT_DATA, onEventData);
        eventPoller.on(window.massa.ON_MASSA_EVENT_ERROR, onEventDataError);
    });
});

// BOT1 SECTION
function getBalancesBot1() {
    let args = new window.massa.Args();
    args.addString(bot1Address);
    web3Client.smartContracts().readSmartContract(
        {
            fee: 0n,
            callerAddress: baseAccount.address,
            maxGas: 1_000_000_000n,
            coins: massa.fromMAS("1"),
            targetAddress: USDCAddress,
            targetFunction: "balanceOf",
            parameter: args.serialize(), // this is based on input arguments
        }
    ).then((result) => {
        web3Client.smartContracts().readSmartContract(
            {
                fee: 0n,
                callerAddress: baseAccount.address,
                maxGas: 1_000_000_000n,
                coins: massa.fromMAS("1"),
                targetAddress: WMASAddress,
                targetFunction: "balanceOf",
                parameter: args.serialize(), // this is based on input arguments
            }
        ).then((result2) => {
            if (balanceBot1 === undefined) {
                let balance1 = new window.massa.Args(result.returnValue).nextU64();
                let balance2 = new window.massa.Args(result2.returnValue).nextU64();
                Plotly.newPlot('chart', [{
                    y: [Number(balance2 / OneUnit)],
                    x: [`Slot : (${result.info.executed_at.period}, ${result.info.executed_at.thread})`],
                    name: "Balance WMAS",
                    type: 'scatter',
                }, {
                    y: [Number(balance1 / OneUnit)],
                    x: [`Slot : (${result.info.executed_at.period}, ${result.info.executed_at.thread})`],
                    name: "Balance USDC",
                    type: 'scatter',
                }], 
                {
                    plot_bgcolor:"#161F34",
                    paper_bgcolor:"#161F34",
                    font: {
                        size: 16,
                        color: 'white'
                    },
                    xaxis: {
                        automargin: true
                    },
                    yaxis: {
                        range: [0, 200000]
                    }

                }, {
                    responsive: true
                });
                balanceBot1 = [`Slot : (${result.info.executed_at.period}, ${result.info.executed_at.thread})`];
            } else {
                let balance1 = new window.massa.Args(result.returnValue).nextU64();
                let balance2 = new window.massa.Args(result2.returnValue).nextU64();
                Plotly.extendTraces('chart',
                    {
                        y: [[Number(balance2 / OneUnit)], [Number(balance1 / OneUnit)]],
                        x: [[`Slot : (${result.info.executed_at.period}, ${result.info.executed_at.thread})`], [`Slot : (${result.info.executed_at.period}, ${result.info.executed_at.thread})`]]
                    },
                    [0, 1], 15);
                balanceBot1.push(`Slot : (${result.info.executed_at.period}, ${result.info.executed_at.thread})`);
            }
        });
    });
}

setInterval(getBalancesBot1, 500)

function startBot1() {
    let massa = window.massa;
    let args = new window.massa.Args();
    web3Client.smartContracts().callSmartContract(
        {
            fee: 0n,
            maxGas: 200_000_000n,
            coins: massa.fromMAS("1"),
            targetAddress: bot1Address,
            functionName: "start",
            parameter: args.serialize(), // this is based on input arguments
        },
        baseAccount
    ).then((result) => {
        console.log(result);
    });
}

function stopBot1() {
    let massa = window.massa;
    let args = new window.massa.Args();
    web3Client.smartContracts().callSmartContract(
        {
            fee: 0n,
            maxGas: 200_000_000n,
            coins: massa.fromMAS("1"),
            targetAddress: bot1Address,
            functionName: "stop",
            parameter: args.serialize(), // this is based on input arguments
        },
        baseAccount
    ).then((result) => {
        console.log(result);
    });
}

// BOT2 SECTION

function getBalancesBot2() {
    let args = new window.massa.Args();
    args.addString(bot2Address);
    web3Client.smartContracts().readSmartContract(
        {
            fee: 0n,
            callerAddress: baseAccount.address,
            maxGas: 20_000_000n,
            coins: massa.fromMAS("1"),
            targetAddress: USDCAddress,
            targetFunction: "balanceOf",
            parameter: args.serialize(), // this is based on input arguments
        }
    ).then((result) => {
        web3Client.smartContracts().readSmartContract(
            {
                fee: 0n,
                callerAddress: baseAccount.address,
                maxGas: 20_000_000n,
                coins: massa.fromMAS("1"),
                targetAddress: WMASAddress,
                targetFunction: "balanceOf",
                parameter: args.serialize(), // this is based on input arguments
            }
        ).then((result2) => {
            if (balanceBot2 === undefined) {
                let balance1 = new window.massa.Args(result.returnValue).nextU64();
                let balance2 = new window.massa.Args(result2.returnValue).nextU64();
                Plotly.newPlot('chart2', [{
                    y: [Number(balance2 / OneUnit)],
                    x: [`Slot : (${result.info.executed_at.period}, ${result.info.executed_at.thread})`],
                    name: "Balance WMAS",
                    type: 'scatter',
                }, {
                    y: [Number(balance1 / OneUnit)],
                    x: [`Slot : (${result.info.executed_at.period}, ${result.info.executed_at.thread})`],
                    name: "Balance USDC",
                    type: 'scatter',
                }], 
                {
                    plot_bgcolor:"#161F34",
                    paper_bgcolor:"#161F34",
                    font: {
                        size: 16,
                        color: 'white'
                    },
                    xaxis: {
                        automargin: true
                    },
                    yaxis: {
                        range: [0, 300000]
                    },
                    autosize: true
                }, {
                    responsive: true
                });
                balanceBot2 = [`Slot : (${result.info.executed_at.period}, ${result.info.executed_at.thread})`];
            } else {
                let balance1 = new window.massa.Args(result.returnValue).nextU64();
                let balance2 = new window.massa.Args(result2.returnValue).nextU64();
                Plotly.extendTraces('chart2',
                    {
                        y: [[Number(balance2 / OneUnit)], [Number(balance1 / OneUnit)]],
                        x: [[`Slot : (${result.info.executed_at.period}, ${result.info.executed_at.thread})`], [`Slot : (${result.info.executed_at.period}, ${result.info.executed_at.thread})`]]
                    },
                    [0, 1], 15);
                balanceBot2.push(`Slot : (${result.info.executed_at.period}, ${result.info.executed_at.thread})`);
            }
        });
    });
}

setInterval(getBalancesBot2, 500)

function startBot2() {
    let massa = window.massa;
    let args = new window.massa.Args();
    web3Client.smartContracts().callSmartContract(
        {
            fee: 0n,
            maxGas: 800_000_000n,
            coins: massa.fromMAS("1"),
            targetAddress: bot2Address,
            functionName: "start",
            parameter: args.serialize(), // this is based on input arguments
        },
        baseAccount
    ).then((result) => {
        console.log(result);
    });
}

function stopBot2() {
    let massa = window.massa;
    let args = new window.massa.Args();
    web3Client.smartContracts().callSmartContract(
        {
            fee: 0n,
            maxGas: 800_000_000n,
            coins: massa.fromMAS("1"),
            targetAddress: bot2Address,
            functionName: "stop",
            parameter: args.serialize(), // this is based on input arguments
        },
        baseAccount
    ).then((result) => {
        console.log(result);
    });
}

// DEBUG SECTION

function onEventData(events) {
    let list = document.getElementById("debug_events");
    for (evt of events) {
        if (evt.data.includes("DEBUG:") || evt.data.includes("BOT1:") || evt.data.includes("BOT2:")) {
            const node = document.createElement("li");
            const textNode = document.createTextNode(evt.data);
            node.appendChild(textNode);
            list.insertBefore(node, list.firstChild)
            console.log(evt.data);
        }
    }
}

function onEventDataError(error) {
    console.log(error);
}

function buyWMAS() {
    let massa = window.massa;
    let args = new window.massa.Args();
    var amount = document.getElementById("buy_amount").value;
    args.addU64(amount);

    web3Client.smartContracts().callSmartContract(
        {
            fee: 0n,
            maxGas: 2_000_000_000n,
            coins: massa.fromMAS("1"),
            targetAddress: debugAddress,
            functionName: "buyWMas",
            parameter: args.serialize(), // this is based on input arguments
        },
        baseAccount
    ).then((result) => {
        console.log(result);
    });
}

function sellWMAS() {
    let massa = window.massa;
    let args = new window.massa.Args();
    var amount = document.getElementById("sell_amount").value;
    args.addU64(amount);
    web3Client.smartContracts().callSmartContract(
        {
            fee: 0n,
            maxGas: 2_000_000_000n,
            coins: massa.fromMAS("1"),
            targetAddress: debugAddress,
            functionName: "sellWMas",
            parameter: args.serialize(), // this is based on input arguments
        },
        baseAccount
    ).then((result) => {
        console.log(result);
    });
}

function startPriceVariation() {
    let massa = window.massa;
    let args = new window.massa.Args();
    web3Client.smartContracts().callSmartContract(
        {
            fee: 0n,
            maxGas: 1_000_000_000n,
            coins: massa.fromMAS("1"),
            targetAddress: priceVariationAddress,
            functionName: "start",
            parameter: args.serialize(), // this is based on input arguments
        },
        baseAccount
    ).then((result) => {
        console.log(result);
    });
}

function stopPriceVariation() {
    let massa = window.massa;
    let args = new window.massa.Args();
    web3Client.smartContracts().callSmartContract(
        {
            fee: 0n,
            maxGas: 1_000_000_000n,
            coins: massa.fromMAS("1"),
            targetAddress: priceVariationAddress,
            functionName: "stop",
            parameter: args.serialize(), // this is based on input arguments
        },
        baseAccount
    ).then((result) => {
        console.log(result);
    });
}

const test = new CustomEvent("test", {});
document.addEventListener("test", function (e) {
    console.log(e);
    Plotly.relayout('chart2', {});
    Plotly.relayout('chart', {});
});

function trigger() {
    document.dispatchEvent(test);
}
