import {
    Address,
    Context,
    generateEvent,
    sendMessage,
    Storage,
} from "@massalabs/massa-as-sdk";
import { IERC20, IFactory, IRouter } from "../interfaces";
import { Args, Result } from "@massalabs/as-types";

export const USDC = new Address("AS1dJ8mrm2cVSdZVZLXo43wRx5FxywZ9BmxiUmXCy7Tx72XNbit8");
export const WMAS = new Address("AS12XdqMFYx1Ghd5LRzMq9hw81hVgBAYX9zqMJVZeVyM9nRn4C2pt");
export const FACTORY = new Address("AS12EF8gYT8B6WxpWm2zWTyQmBH2T1eYakjYyfJsjyUAxWH6n6v5X");
export const ROUTER = new Address("AS1ZbaNKTVMQrcV2rYC11sxm7mVYnwpnSUgr9Kb5xq2fDkZdjuXT");
export const ONE_UNIT = 10 ** 9;

export function callNextSlot(at: Address, function_name: string, gas: u64): void {
    // emit wakeup message
    const cur_period = Context.currentPeriod();
    const cur_thread = Context.currentThread();
    let next_thread = cur_thread + 1;
    let next_period = cur_period;
    if (next_thread >= 32) {
        ++next_period;
        next_thread = 0;
    }
    sendMessage(at, function_name, next_period, next_thread, next_period + 5, next_thread, gas, 0, 0, []);
}

export function getWmasPrice(): f64 {
    const binStep: u64 = 100;
    const router = new IRouter(ROUTER);
    const factory = new IFactory(FACTORY);
    const wmas = new IERC20(WMAS);
    const usdc = new IERC20(USDC);
    const pair = factory.getLBPairInformation(wmas._origin, usdc._origin, binStep).pair;
    const wmas_is_y = pair.getTokenY()._origin == wmas._origin;
    return f64(router.getSwapOut(pair, 1 * ONE_UNIT, !wmas_is_y).amountOut) / f64(ONE_UNIT);
}

export function sellWmas(amount: u64): void {
    const binStep: u64 = 100;
    const router = new IRouter(ROUTER);
    const wmas = new IERC20(WMAS);
    const usdc = new IERC20(USDC);
    const deadline = Context.timestamp() + 5000;
    const callee = Context.callee();
    const amount2 = amount * ONE_UNIT;
    const wmas_balance = wmas.balanceOf(callee);
    const amountIn = wmas_balance > amount2 ? amount2 : wmas_balance;
    const path = [wmas, usdc];
    router.swapExactTokensForTokens(amountIn, 0, [binStep], path, callee, deadline);
}

export function buyWmas(amount: u64): void {
    const binStep: u64 = 100;
    const router = new IRouter(ROUTER);
    const factory = new IFactory(FACTORY);
    const wmas = new IERC20(WMAS);
    const usdc = new IERC20(USDC);
    const pair = factory.getLBPairInformation(wmas._origin, usdc._origin, binStep).pair;
    const wmas_is_y = pair.getTokenY()._origin == wmas._origin;
    const amountOut = amount * ONE_UNIT;
    const amountIn = router.getSwapIn(pair, amountOut, wmas_is_y).amountIn;
    const path = [usdc, wmas];
    const deadline = Context.timestamp() + 5000;
    router.swapExactTokensForTokens(amountIn, 0, [binStep], path, Context.callee(), deadline);
}

export function saveDiffPriceToHistory(old_price: f64, new_price: f64): void {
    generateEvent(`BOT2: Old price ${old_price} new price ${new_price}`);
    if (old_price > new_price) {
        const args = new Args();
        args.add("down");
        const down_storage = Storage.get(args.serialize());
        const content = new Args(down_storage);
        let size: u64 = content.nextU64().unwrap();
        size += 1;
        const new_content = new Args();
        new_content.add(size);
        while (1 == 1) {
            const value = content.nextU64();
            if (value.isOk()) {
                new_content.add(value.unwrap());
            } else {
                break;
            }
        }
        new_content.add(u64(((new_price - old_price) / old_price) * 100 * -1 * 1000));
        generateEvent(`BOT2: Save a lower of ${((new_price - old_price) / old_price) * 100 * -1}%`);
        Storage.set(args.serialize(), new_content.serialize());
    } else {
        const args = new Args();
        args.add("up");
        const up_storage = Storage.get(args.serialize());
        const content = new Args(up_storage);
        let size: u64 = content.nextU64().unwrap();
        size += 1;
        const new_content = new Args();
        new_content.add(size);
        while (1 == 1) {
            const value = content.nextU64();
            if (value.isOk()) {
                new_content.add(value.unwrap());
            } else {
                break;
            }
        }
        new_content.add(u64(((new_price - old_price) / old_price) * 100) * 1000);
        generateEvent(`BOT2: Save a higher of ${((new_price - old_price) / old_price) * 100}%`);
        Storage.set(args.serialize(), new_content.serialize());
    }
}

export function calculateRSI(): Result<f64> {
    const up_storage = new Args(Storage.get(new Args().add("up").serialize()));
    const down_storage = new Args(Storage.get(new Args().add("down").serialize()));
    const up_size: f64 = f64(up_storage.nextU64().unwrap());
    const down_size: f64 = f64(down_storage.nextU64().unwrap());
    const size = up_size + down_size;
    if (size != 10) {
        generateEvent(`BOT2: The size is not 10 but ${size}`);
        return new Result(0, "The size is not 10");
    }
    // Mean of the up array
    let up_mean: f64 = 0;
    for (let i: f64 = 0; i < up_size; i++) {
        up_mean += f64(up_storage.nextU64().unwrap()) / 1000;
    }
    up_mean = up_mean / size;
    // Mean of the down array
    let down_mean: f64 = 0;
    for (let i: f64 = 0; i < down_size; i++) {
        down_mean += f64(down_storage.nextU64().unwrap()) / 1000;
    }
    down_mean = down_mean / size;
    if (down_mean == 0) {
        generateEvent(`BOT2: Down mean is 0`);
        return new Result(100);
    }
    // get RSI
    generateEvent(`BOT2: Up mean ${up_mean} down mean ${down_mean}`);
    return new Result(100.0 - 100.0 / (1.0 + up_mean / down_mean));
}

export function saveLastWmasPrice(): void {
    const wmas = new IERC20(WMAS);
    const usdc = new IERC20(USDC);
    const router = new IRouter(ROUTER);
    const binStep: u64 = 100;
    const factory = new IFactory(FACTORY);
    const pair = factory.getLBPairInformation(wmas._origin, usdc._origin, binStep).pair;
    const wmas_is_y = pair.getTokenY()._origin == wmas._origin;
    const wmas_price = f64(router.getSwapOut(pair, 1 * ONE_UNIT, !wmas_is_y).amountOut) / f64(ONE_UNIT);
    Storage.set("last_wmas_price", wmas_price.toString());
}

export function getLastWmasPrice(): f64 {
    return f64(parseFloat(Storage.get("last_wmas_price")));
}

export function initRSIStorage(): void {
    const args = new Args();
    args.add("up");
    const content = new Args();
    content.add(u64(0));
    Storage.set(args.serialize(), content.serialize());
    const args2 = new Args();
    args2.add("down");
    Storage.set(args2.serialize(), content.serialize());
}
