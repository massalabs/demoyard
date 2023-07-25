import { Args } from "@massalabs/as-types";
import {
    Context,
    generateEvent,
    Storage,
    sendMessage,
    unsafeRandom,
} from "@massalabs/massa-as-sdk";
import { IERC20, IFactory, IRouter } from "../interfaces";
import { FACTORY, ONE_UNIT, ROUTER, USDC, WMAS, buyWmas, sellWmas } from "./library";

export function constructor(_: StaticArray<u8>): void {
    const callee = Context.callee();
    const one_unit = 10 ** 9;

    const usdc = new IERC20(USDC);
    usdc.mint(callee, 1_000_000 * one_unit);

    const wmas = new IERC20(WMAS);
    wmas.mint(callee, 1_000_000 * one_unit);

    const router = new IRouter(ROUTER);

    // approve
    usdc.increaseAllowance(router._origin, 1_000_000_000 * one_unit);
    wmas.increaseAllowance(router._origin, 1_000_000_000 * one_unit);

    generateEvent(`DEBUG: Deployed at ${Context.callee()}.`);
}

// ==================================================== //
// ====               SC AUTOMATION                ==== //
// ==================================================== //

export function start(_: StaticArray<u8>): void {
    Storage.set("counter", "0");
    generateEvent(`DEBUG: Start price variation SC.`);
    advance(new Args().serialize());
}

/**
 * @notice Stop the contract automation
 * @param _ unused see https://github.com/massalabs/massa-sc-std/issues/18
 */
export function stop(_: StaticArray<u8>): void {
    Storage.set("counter", "2000000000");
    generateEvent(`DEBUG: Stop price variation SC.`);
}

/**
 * @notice Contract automation
 * @param _ unused see https://github.com/massalabs/massa-sc-std/issues/18
 */
export function advance(_: StaticArray<u8>): void {
    /// @notice Initialisation of the number of threads
    const threads: u8 = 32;

    let counter: u64 = u64(parseInt(Storage.has("counter") ? Storage.get("counter") : "0"));
    if (counter > 300) {
        return;
    }
    const binStep: u64 = 100;
    const one_unit = 10 ** 9;
    const router = new IRouter(ROUTER);
    const factory = new IFactory(FACTORY);
    const wmas = new IERC20(WMAS);
    const usdc = new IERC20(USDC);
    const pair = factory.getLBPairInformation(wmas._origin, usdc._origin, binStep).pair;
    const callee = Context.callee();
    const deadline = Context.timestamp() + 5000;
    const wmas_is_y = pair.getTokenY()._origin == wmas._origin;

    generateEvent(`DEBUG: The USDC amount of the contract before swap: ${(usdc.balanceOf(callee) / ONE_UNIT).toString()} 
    The WMAS amount of the contract before swap: ${(wmas.balanceOf(callee)/ ONE_UNIT).toString()}
    The number of USDC in the pool before swap: ${
        (wmas_is_y ? pair.getPairInformation().reserveX : pair.getPairInformation().reserveY) / ONE_UNIT
    }
    The number of WMAS in the pool before swap: ${
        (wmas_is_y ? pair.getPairInformation().reserveY : pair.getPairInformation().reserveX) / ONE_UNIT
    }
    The active id before swap: ${pair.getPairInformation().activeId}
    The price of 1 WMAS before swap: ${
        f64(router.getSwapOut(pair, 1 * one_unit, !wmas_is_y).amountOut) / f64(one_unit)
    }`);

    let rand = _randomUintInRange(5) * 200 + _randomUintInRange(10);
    if (rand == 0) {
        rand = 200;
    }
    if (rand % 2 == 0) {
        generateEvent(`DEBUG: Buy ${rand.toString()} WMAS`);
        buyWmas(rand)
    } else {
        generateEvent(`DEBUG: Sell ${rand.toString()} WMAS`);
        sellWmas(rand)
    }

    generateEvent(`DEBUG: The USDC amount of the contract after swap: ${(usdc.balanceOf(callee)/ONE_UNIT).toString()} 
    The WMAS amount of the contract after swap: ${(wmas.balanceOf(callee)/ONE_UNIT).toString()}
    The number of USDC in the pool after swap: ${
        (wmas_is_y ? pair.getPairInformation().reserveX : pair.getPairInformation().reserveY) / ONE_UNIT
    }
    The number of WMAS in the pool after swap: ${
       (wmas_is_y ? pair.getPairInformation().reserveY : pair.getPairInformation().reserveX) /ONE_UNIT
    }
    The active id after swap: ${pair.getPairInformation().activeId}
    The price of 1 WMAS after swap: ${
        f64(router.getSwapOut(pair, 1 * one_unit, !wmas_is_y).amountOut) / f64(one_unit)
    }`);

    // emit wakeup message
    const cur_period = Context.currentPeriod();
    const cur_thread = Context.currentThread();
    let next_thread = cur_thread + 1;
    let next_period = cur_period;
    if (next_thread >= threads) {
        ++next_period;
        next_thread = 0;
    }
    const cur_addr = Context.callee();
    counter += 1;
    Storage.set("counter", counter.toString());
    sendMessage(cur_addr, "advance", next_period, next_thread, next_period + 5, next_thread, 700_000_000, 0, 0, []);
}

function _randomUintInRange(range: i64): u64 {
    const random: i64 = unsafeRandom();
    const mod = random % range;
    return u64(abs(mod));
}
