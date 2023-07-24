import { Args } from "@massalabs/as-types";
import {
    Address,
    Context,
    generateEvent,
    Storage,
} from "@massalabs/massa-as-sdk";
import { IERC20, IRouter } from "../interfaces";
import { ONE_UNIT, ROUTER, USDC, WMAS, buyWmas, callNextSlot, getWmasPrice, sellWmas } from "./library";

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

    generateEvent(`BOT1: Deployed at ${Context.callee()}.`);
}

export function start(_: StaticArray<u8>): void {
    Storage.set("counter", "0");
    advance(new Args().serialize());
}

export function stop(_: StaticArray<u8>): void {
    Storage.set("counter", "2000000000");
    generateEvent(`BOT1: Stop.`);
}

export function advance(_: StaticArray<u8>): void {
    let counter: u64 = u64(parseInt(Storage.has("counter") ? Storage.get("counter") : "0"));
    if (counter > 300) {
        return;
    }
    const callee = Context.callee();
    const wmas = new IERC20(WMAS);
    const usdc = new IERC20(USDC);
    const wmas_price = getWmasPrice();

    generateEvent(`BOT1: My balance of WMAS is: ${(wmas.balanceOf(callee) / ONE_UNIT).toString()}`);
    generateEvent(`BOT1: My balance of USDC is: ${(usdc.balanceOf(callee)/ ONE_UNIT).toString()}`);
    if (wmas_price < 20) {
        generateEvent(`BOT1: The price of WMAS is lower than 20: ${wmas_price} I'll buy WMAS`);
        buyWmas(500);
    } else {
        const wmas_balance = wmas.balanceOf(callee);
        if (wmas_balance == 0) {
            return;
        }
        generateEvent(`BOT1: The price of WMAS is higher than 20: ${wmas_price} I'll sell WMAS`);
        sellWmas(200);
    }
    generateEvent(`BOT1: My balance of WMAS is now: ${(wmas.balanceOf(callee) / ONE_UNIT).toString()}`);
    generateEvent(`BOT1: My balance of USDC is now: ${(usdc.balanceOf(callee)/ ONE_UNIT).toString()}`);
    generateEvent(`BOT1: The price of 1 WMAS after swap: ${getWmasPrice()}`);

    counter += 1;
    Storage.set("counter", counter.toString());
    // Replace by calling each time price change price should be saved
    callNextSlot(Context.callee(), "advance", 700_000_000);
}
