import {
    isRecord,
    TERMINAL_OUTCOME,
    type TerminalOutcome,
} from "@signalsafe/tree-spec";
import { TreeSpecRuntimeError } from "./errors.js";

/** Runtime wire root must be a non-null plain object (not an array). */
export function expectRuntimeObject(raw: unknown): Record<string, unknown> {
    if (!isRecord(raw)) {
        throw new TreeSpecRuntimeError("tree_spec must be a non-null object.");
    }
    return raw;
}

/** Validate and narrow a transition END outcome to {@link TerminalOutcome}. */
export function expectTerminalOutcome(outcome: unknown): TerminalOutcome {
    switch (outcome) {
        case TERMINAL_OUTCOME.SAFE:
        case TERMINAL_OUTCOME.AT_RISK:
        case TERMINAL_OUTCOME.COMPROMISED:
            return outcome;
        default:
            throw new TreeSpecRuntimeError(
                "Transition to END must include a valid outcome.",
            );
    }
}

/** Exhaustiveness check for discriminated-union dispatch handling. */
export function assertNever(value: never): never {
    throw new TreeSpecRuntimeError(
        `Unexpected discriminated value: ${String(value)}`,
    );
}
