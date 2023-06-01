import * as dotenv from "dotenv";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { deploySC, WalletClient, ISCData } from "@massalabs/massa-sc-deployer";
import { MassaUnits } from "@massalabs/massa-web3";

dotenv.config();

const publicApi = "http://149.202.84.7:33035";
// const publicApi = DefaultProviderUrls.LOCALNET;

const privKey = process.env.WALLET_PRIVATE_KEY;
if (!privKey) {
    throw new Error("Missing WALLET_PRIVATE_KEY in .env file");
}

const deployerAccount = await WalletClient.getAccountFromSecretKey(privKey);
const deployerAddress = deployerAccount.address || "";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(path.dirname(__filename));

(async () => {
    const price_variation: ISCData = {
        data: readFileSync(path.join(__dirname, "build", "price_variation.wasm")),
        coins: BigInt(3) * MassaUnits.oneMassa,
    };
    const simple_bot: ISCData = {
        data: readFileSync(path.join(__dirname, "build", "bot.wasm")),
        coins: BigInt(3) * MassaUnits.oneMassa,
    };
    const bot: ISCData = {
        data: readFileSync(path.join(__dirname, "build", "bot_rsi.wasm")),
        coins: BigInt(3) * MassaUnits.oneMassa,
    };
    const commands: ISCData = {
        data: readFileSync(path.join(__dirname, "build", "commands.wasm")),
        coins: BigInt(3) * MassaUnits.oneMassa,
    };

    await deploySC(publicApi, deployerAccount, [bot], BigInt(0), BigInt(4_200_000_000), true);
})();
