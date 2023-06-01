import { Context, generateEvent } from "@massalabs/massa-as-sdk";
import { IERC20, IFactory, IRouter } from "../interfaces";
import { ONE_UNIT, ROUTER, USDC, WMAS } from "./library";
import { Args } from "@massalabs/as-types";
import { FACTORY } from "./library";

export function constructor(_: StaticArray<u8>): void {
    const callee = Context.callee();
    const one_unit = 10 ** 9;

    const usdc = new IERC20(USDC);
    usdc.mint(callee, 1_000_000 * ONE_UNIT);

    const wmas = new IERC20(WMAS);
    wmas.mint(callee, 1_000_000 * ONE_UNIT);
    const router = new IRouter(ROUTER);

    // approve
    usdc.increaseAllowance(router._origin, 1_000_000_000 * ONE_UNIT);
    wmas.increaseAllowance(router._origin, 1_000_000_000 * ONE_UNIT);

    generateEvent(`Address of debugger: ${Context.callee().toString()}`);
}

export function buyWMas(args_: StaticArray<u8>): void {
    const args = new Args(args_);
    let amount = args.nextU64().unwrap();
    const binStep: u64 = 100;
    const router = new IRouter(ROUTER);
    const factory = new IFactory(FACTORY);
    const wmas = new IERC20(WMAS);
    const usdc = new IERC20(USDC);
    const pair = factory.getLBPairInformation(wmas._origin, usdc._origin, binStep).pair;
    const wmas_is_y = pair.getTokenY()._origin == wmas._origin;
    const swapForY = wmas_is_y;
    const amountIn = router.getSwapIn(pair, amount * ONE_UNIT, swapForY).amountIn;
    const path = [usdc, wmas];
    const deadline = Context.timestamp() + 5000;
    router.swapExactTokensForTokens(amountIn, 0, [binStep], path, Context.callee(), deadline);
    generateEvent(`DEBUG: Bought ${amount} WMAS for ${amountIn} USDC`);
}

export function sellWMas(args_: StaticArray<u8>): void {
    const args = new Args(args_);
    let amount = args.nextU64().unwrap();
    const binStep: u64 = 100;
    const router = new IRouter(ROUTER);
    const wmas = new IERC20(WMAS);
    const usdc = new IERC20(USDC);
    const factory = new IFactory(FACTORY);
    const pair = factory.getLBPairInformation(wmas._origin, usdc._origin, binStep).pair;
    const wmas_is_y = pair.getTokenY()._origin == wmas._origin;
    const swapForY = wmas_is_y;
    const deadline = Context.timestamp() + 5000;
    const callee = Context.callee();
    const amountIn = amount * ONE_UNIT;
    const path = [wmas, usdc];
    const amountOut = router.getSwapOut(pair, amount * ONE_UNIT, swapForY).amountOut;
    router.swapExactTokensForTokens(amountIn, 0, [binStep], path, callee, deadline);
    generateEvent(`DEBUG: Sold ${amount} WMAS for ${amountOut} USDC`);
}