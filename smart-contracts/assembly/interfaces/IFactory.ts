import { Args, Result, Serializable } from "@massalabs/as-types";
import { Address, call } from "@massalabs/massa-as-sdk";
import { IPair } from "./IPair";

/// Structure to store the LBPair information, such as:
class LBPairInformation implements Serializable {
    /**
     * @param {u32} binStep - The bin step of the LBPair
     * @param {IPair} pair - The address of the LBPair
     * @param {bool} createdByOwner - Whether the LBPair was created by the owner or the factory
     * @param {bool} ignoredForRouting - Whether the LBPair is ignored for routing or not. An ignored pair will not be explored during routes finding
     */
    constructor(
        public binStep: u32 = 0,
        public pair: IPair = new IPair(new Address()),
        public createdByOwner: bool = false,
        public ignoredForRouting: bool = false,
    ) {}

    // ======================================================== //
    // ====                  SERIALIZATION                 ==== //
    // ======================================================== //

    serialize(): StaticArray<u8> {
        return new Args()
            .add(this.binStep)
            .add(this.pair._origin)
            .add(this.createdByOwner)
            .add(this.ignoredForRouting)
            .serialize();
    }

    deserialize(data: StaticArray<u8>, offset: i32): Result<i32> {
        const args = new Args(data, offset);
        this.binStep = args.nextU32().expect("Failed to deserialize binStep");
        this.pair = new IPair(new Address(args.nextString().expect("Failed to deserialize pair")));
        this.createdByOwner = args.nextBool().expect("Failed to deserialize createdByOwner");
        this.ignoredForRouting = args.nextBool().expect("Failed to deserialize ignoredForRouting");
        return new Result(args.offset);
    }
}

export class IFactory {
    _origin: Address;

    /**
     * Wraps a smart contract exposing standard token FFI.
     *
     * @param {Address} at - Address of the smart contract.
     */
    constructor(at: Address) {
        this._origin = at;
    }

    getLBPairInformation(_tokenA: Address, _tokenB: Address, _binStep: u64): LBPairInformation {
        const args = new Args().add(_tokenA).add(_tokenB).add(_binStep);
        const res = call(this._origin, "getLBPairInformation", args, 0);
        return new Args(res).nextSerializable<LBPairInformation>().unwrap();
    }
}
