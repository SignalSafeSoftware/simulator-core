import { describe, expect, it } from "vitest";
import { TreeSpecRuntimeError } from "../src/errors.js";
import { assertNever } from "../src/guards.js";

describe("assertNever", () => {
    it("throws TreeSpecRuntimeError naming the unexpected discriminated value", () => {
        expect(() => assertNever("bad-value" as never)).toThrow(
            TreeSpecRuntimeError,
        );
        expect(() => assertNever("bad-value" as never)).toThrow(
            "Unexpected discriminated value: bad-value",
        );
    });
});
