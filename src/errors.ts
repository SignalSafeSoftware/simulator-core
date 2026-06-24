/** Malformed tree_spec or invalid decision for the current session. */
export class TreeSpecRuntimeError extends Error {
    readonly name = "TreeSpecRuntimeError";

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
