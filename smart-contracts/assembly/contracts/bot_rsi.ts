import { Args } from "@massalabs/as-types";
import {
    Context,
    generateEvent,
    Storage,
} from "@massalabs/massa-as-sdk";
import { IERC20, IRouter } from "../interfaces";
import {
    ONE_UNIT,
    ROUTER,
    USDC,
    WMAS,
    buyWmas,
    calculateRSI,
    callNextSlot,
    getLastWmasPrice,
    getWmasPrice,
    initRSIStorage,
    saveDiffPriceToHistory,
    saveLastWmasPrice,
    sellWmas,
} from "./library";

export function constructor(_: StaticArray<u8>): void {
    const callee = Context.callee();

    const usdc = new IERC20(USDC);
    usdc.mint(callee, 100_000 * ONE_UNIT);

    const wmas = new IERC20(WMAS);
    wmas.mint(callee, 20_000 * ONE_UNIT);
    const router = new IRouter(ROUTER);

    // approve
    usdc.increaseAllowance(router._origin, 1_000_000_000 * ONE_UNIT);
    wmas.increaseAllowance(router._origin, 1_000_000_000 * ONE_UNIT);
    generateEvent(`BOT2: Deployed at ${Context.callee()}.`);
}

export function start(_: StaticArray<u8>): void {
    Storage.set("counter", "0");
    generateEvent(`BOT2: Start.`);
    initRSIStorage();
    saveLastWmasPrice();
    advance(new Args().serialize());
}

export function stop(_: StaticArray<u8>): void {
    Storage.set("counter", "2000000000");
    generateEvent(`BOT2: Stop.`);
}


export function advance(_: StaticArray<u8>): void {
    let counter: u64 = u64(parseInt(Storage.has("counter") ? Storage.get("counter") : "0"));
    if (counter > 400) {
        return;
    }
    const wmas_price = getWmasPrice();
    if (counter % 10 == 0 && counter != 0) {
        const rsi = calculateRSI().unwrap();
        generateEvent(`The RSI is: ${rsi}`);
        if (rsi < 30) {
            generateEvent(`BOT2: The rsi is ${rsi}. I will buy WMAS at price: ${wmas_price}.`);
            buyWmas(500);
        } else if (rsi > 70) {
            const wmas = new IERC20(WMAS);
            const wmas_balance = wmas.balanceOf(Context.callee());
            if (wmas_balance == 0) {
                return;
            }
            generateEvent(`BOT2: The rsi is ${rsi}. I will sell WMAS at price: ${wmas_price}.`);
            sellWmas(500);
        }
        initRSIStorage();
    }

    const last_wmas_price = getLastWmasPrice();
    saveDiffPriceToHistory(last_wmas_price, wmas_price);
    saveLastWmasPrice();
    counter += 1;
    Storage.set("counter", counter.toString());
    callNextSlot(Context.callee(), "advance", 700_000_000);
}
