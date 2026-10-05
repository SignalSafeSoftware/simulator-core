/**
 * Canonical full-device simulator payload (`simulator_json` / `detail.simulator`).
 * Framework-agnostic; consumed by simulator-react adapters and simulator-device UI.
 */

import type { SimulatorApp } from './simulatorApp.js';

/** Where the scenario starts: which app and which screen within it. */
export interface SimulatorEntryPoint {
    app: SimulatorApp;
    /** App-specific screen id; for internet see {@link SimulatorInternetScreenId}. */
    screen: string;
}

/** One item on the device main (bottom) menu. */
export interface SimulatorMainMenuItem {
    id: string;
    label: string;
    app?: SimulatorApp;
}

/** Device-level config: main menu and secondary (app) defaults. */
export interface SimulatorDevice {
    main_menu_items?: SimulatorMainMenuItem[];
    secondary_defaults?: Partial<Record<SimulatorApp, string>>;
}

/** Single contact; shared by phone, messages, etc. */
/** A labeled contact endpoint. Value preserves display text; number is an optional dialable canonical number. */
export interface SimulatorContactValue {
    label: string;
    value: string;
    number?: string;
}

export interface SimulatorContact {
    id: string;
    display_name: string;
    phone_numbers?: SimulatorContactValue[];
    email_addresses?: SimulatorContactValue[];
    number?: string;
    email?: string;
}

/** Official/trusted directory entry on the device. */
export interface SimulatorDirectoryEntry {
    id: string;
    label: string;
    contact_id?: string | null;
    number?: string | null;
    url?: string | null;
    description?: string | null;
}

export interface SimulatorEmailMessageRow {
    id: string;
    folder_id: string;
    subject: string;
    from: string;
    from_addr?: string;
    from_display_name?: string;
    snippet?: string;
    date_at?: string;
    unread?: boolean;
}

export interface SimulatorPayloadEmailLink {
    href: string;
    text: string;
    title?: string;
}

export interface SimulatorEmailMessageDetail {
    id: string;
    subject: string;
    from: string;
    from_addr?: string;
    from_display_name?: string;
    to?: string;
    bcc?: string;
    cc?: string;
    date_at?: string;
    unread?: boolean;
    body: string;
    reply_to?: string;
    return_path?: string;
    links?: SimulatorPayloadEmailLink[];
    attachment_name?: string;
    attachment_type?: string;
    attachment_behavior?: string;
    snippet?: string;
}

export interface SimulatorEmailApp {
    messages?: SimulatorEmailMessageRow[];
    detail?: SimulatorEmailMessageDetail | null;
}

export interface SmsMessageAttachment {
    label: string;
    url?: string;
}

export interface SmsThreadMessage {
    /** Stable host identity for history reconciliation; optional for authored scenario messages. */
    id?: string;
    from: 'them' | 'me';
    text: string;
    delay_seconds?: number;
    timestamp?: string;
    attachment?: SmsMessageAttachment;
}

export interface SimulatorSmsThreadSummary {
    id: string;
    contact_name?: string;
    contact_number?: string;
    snippet?: string;
    last_at?: string;
    unread?: boolean;
}

export interface SimulatorSmsThreadDetail {
    id?: string;
    messages: SmsThreadMessage[];
    sender_display_name?: string;
    sender_number?: string;
    last_at?: string;
    unread?: boolean;
}

export interface SimulatorMessagesApp {
    threads?: SimulatorSmsThreadSummary[];
    thread_detail?: SimulatorSmsThreadDetail | null;
}

export interface BrowserFormField {
    name: string;
    type: 'text' | 'password' | 'email';
    label: string;
}

export interface SimulatorPageButton {
    label?: string;
    href?: string;
    target_page_id?: string;
}

export interface SimulatorInternetPage {
    id: string;
    url: string;
    title: string;
    layout?: string;
    content?: string;
    buttons?: SimulatorPageButton[];
    submit_target_page_id?: string | null;
    logo_url?: string | null;
    warning_banner?: string | null;
    show_media_placeholder?: boolean;
}

export interface SimulatorInternetForm {
    id: string;
    page_id?: string;
    fields: BrowserFormField[];
}

export interface SimulatorInternetApp {
    pages?: SimulatorInternetPage[];
    forms?: SimulatorInternetForm[];
}

export interface SimulatorPhoneIncomingCall {
    phone_number?: string;
    caller_name?: string;
    caller_title?: string;
    transcript?: string;
    avatar_url?: string;
}

export interface SimulatorPayloadCallEntry {
    id: string;
    number?: string;
    name?: string;
    direction?: 'in' | 'out' | 'missed' | 'voicemail';
    timestamp?: string;
}

export interface SimulatorPhoneApp {
    history?: SimulatorPayloadCallEntry[];
    contacts?: string[];
    dial?: {
        digits?: string;
    };
    incoming_call?: SimulatorPhoneIncomingCall | null;
    voicemail?: {
        transcript?: string;
        caller_name?: string;
        timestamp?: string;
    };
}

export interface SimulatorPayloadHomeWidget {
    id: string;
    type?: string;
    label?: string;
}

export interface SimulatorPayloadFeaturedApp {
    id: string;
    name: string;
}

export interface SimulatorPayloadSettingsSection {
    id: string;
    title: string;
}

export interface SimulatorHomeApp {
    home?: {
        widgets?: SimulatorPayloadHomeWidget[];
    };
    store?: {
        featured_apps?: SimulatorPayloadFeaturedApp[];
    };
    settings?: {
        sections?: SimulatorPayloadSettingsSection[];
    };
}

/**
 * Full-device simulator payload (simulator_json).
 *
 * Describes the complete simulated device state: entry point, apps, shared contacts,
 * and directory entries. TreeSpec handles outcomes and branching.
 */
export interface SimulatorDevicePayload {
    device?: SimulatorDevice;
    entry_point?: SimulatorEntryPoint;
    contacts?: SimulatorContact[];
    phone?: SimulatorPhoneApp;
    email?: SimulatorEmailApp;
    messages?: SimulatorMessagesApp;
    internet?: SimulatorInternetApp;
    home?: SimulatorHomeApp;
    directory?: SimulatorDirectoryEntry[];
}

/** Built-in phone screen IDs; browser page IDs remain free-form. */
export const SimulatorPhoneScreenId = Object.freeze({
    History: 'history',
    Contacts: 'contacts',
    AddContact: 'add_contact',
    Dial: 'dial',
    IncomingCall: 'incoming_call',
    Voicemail: 'voicemail',
    Directory: 'directory',
} as const);
export type SimulatorPhoneScreenId =
    (typeof SimulatorPhoneScreenId)[keyof typeof SimulatorPhoneScreenId];
const phoneScreens: ReadonlySet<string> = new Set(Object.values(SimulatorPhoneScreenId));
export function isPhoneScreen(value: unknown): value is SimulatorPhoneScreenId {
    return typeof value === 'string' && phoneScreens.has(value);
}

/** Built-in email screen IDs; browser page IDs remain free-form. */
export const SimulatorEmailScreenId = Object.freeze({
    List: 'list',
    Detail: 'detail',
    Compose: 'compose',
    Outbox: 'outbox',
    Trash: 'trash',
} as const);
export type SimulatorEmailScreenId =
    (typeof SimulatorEmailScreenId)[keyof typeof SimulatorEmailScreenId];
const emailScreens: ReadonlySet<string> = new Set(Object.values(SimulatorEmailScreenId));
export function isEmailScreen(value: unknown): value is SimulatorEmailScreenId {
    return typeof value === 'string' && emailScreens.has(value);
}

/** Built-in messages screen IDs; browser page IDs remain free-form. */
export const SimulatorMessagesScreenId = Object.freeze({
    Threads: 'threads',
    ThreadDetail: 'thread_detail',
    NewThread: 'new_thread',
} as const);
export type SimulatorMessagesScreenId =
    (typeof SimulatorMessagesScreenId)[keyof typeof SimulatorMessagesScreenId];
const messagesScreens: ReadonlySet<string> = new Set(Object.values(SimulatorMessagesScreenId));
export function isMessagesScreen(value: unknown): value is SimulatorMessagesScreenId {
    return typeof value === 'string' && messagesScreens.has(value);
}

/** Built-in internet screen IDs; browser page IDs remain free-form. */
export const SimulatorInternetScreenId = Object.freeze({
    Pages: 'pages',
    Page: 'page',
} as const);
export type SimulatorInternetScreenId =
    (typeof SimulatorInternetScreenId)[keyof typeof SimulatorInternetScreenId];

/** Built-in home screen IDs; browser page IDs remain free-form. */
export const SimulatorHomeScreenId = Object.freeze({
    Home: 'home',
    Store: 'store',
    Settings: 'settings',
} as const);
export type SimulatorHomeScreenId =
    (typeof SimulatorHomeScreenId)[keyof typeof SimulatorHomeScreenId];
const homeScreens: ReadonlySet<string> = new Set(Object.values(SimulatorHomeScreenId));
export function isHomeScreen(value: unknown): value is SimulatorHomeScreenId {
    return typeof value === 'string' && homeScreens.has(value);
}

/** Union of app screen id types for authoring helpers. */
export type SimulatorScreenId =
    | SimulatorPhoneScreenId
    | SimulatorEmailScreenId
    | SimulatorMessagesScreenId
    | SimulatorInternetScreenId
    | SimulatorHomeScreenId;
