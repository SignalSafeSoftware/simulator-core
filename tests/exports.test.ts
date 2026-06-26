import { describe, expect, it } from "vitest";
import * as simulatorCore from "../src/index";

const EXPECTED_FUNCTIONS = [
    "emptyScoreDelta",
    "mergeScoreDelta",
    "findTransitionForChoice",
    "getWireChoices",
    "parseTreeSpecRuntime",
    "getTreeSpecNodeView",
    "resolveFeedbackForTransition",
    "createInitialTreeSpecSession",
    "dispatchTreeSpecChoice",
    "treeSpecRuntimeIssues",
] as const;

describe("public barrel exports", () => {
    it("exposes documented runtime functions", () => {
        for (const name of EXPECTED_FUNCTIONS) {
            expect(typeof simulatorCore[name]).toBe("function");
        }
    });

    it("exposes TreeSpecRuntimeError", () => {
        expect(typeof simulatorCore.TreeSpecRuntimeError).toBe("function");
    });
});
