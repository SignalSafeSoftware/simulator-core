import { describe, expect, it } from "vitest";
import {
    hasDeviceEntryPoint,
    isSimulatorDevicePayload,
} from "../src/devicePayloadGuards.js";
import type { SimulatorDevicePayload } from "../src/devicePayload.js";
import * as simulatorCore from "../src/index.js";

describe("device payload guards", () => {
    it("hasDeviceEntryPoint requires entry_point.app string", () => {
        expect(hasDeviceEntryPoint({ entry_point: { app: "email", screen: "list" } })).toBe(true);
        expect(hasDeviceEntryPoint({ entry_point: { screen: "list" } })).toBe(false);
        expect(hasDeviceEntryPoint({})).toBe(false);
    });

    it("isSimulatorDevicePayload requires non-empty object with entry point", () => {
        const payload: SimulatorDevicePayload = {
            entry_point: { app: "phone", screen: "history" },
        };
        expect(isSimulatorDevicePayload(payload)).toBe(true);
        expect(isSimulatorDevicePayload({})).toBe(false);
        expect(isSimulatorDevicePayload(null)).toBe(false);
    });
});

describe("device payload exports", () => {
    it("re-exports payload types and guards from the public barrel", () => {
        expect(typeof simulatorCore.hasDeviceEntryPoint).toBe("function");
        expect(typeof simulatorCore.isSimulatorDevicePayload).toBe("function");
    });
});
