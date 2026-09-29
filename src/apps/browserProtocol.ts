import { z } from 'zod';
/** Wire values shared by the host validator and both mock-page renderers. */
export const BROWSER_ACTION_TYPE = 'simulator.browser.action';
export const BROWSER_ACTION_VERSION = 1;
export const browserActionSchema = z
    .object({
        type: z.literal(BROWSER_ACTION_TYPE),
        version: z.literal(BROWSER_ACTION_VERSION),
        pageId: z.string().max(200),
        session: z.string().max(200),
        action: z.string().min(1).max(200),
        event: z.enum(['click', 'submit', 'change', 'custom']),
        values: z
            .record(
                z.string().max(100),
                z.union([z.string().max(10000), z.array(z.string().max(10000)).max(100)]),
            )
            .refine((value) => Object.keys(value).length <= 100),
    })
    .strict();
export type BrowserAction = z.infer<typeof browserActionSchema>;
