/**
 * Canonical full-device simulator payload (`simulator_json` / `detail.simulator`).
 * Framework-agnostic; consumed by simulator-react adapters and simulator-device UI.
 */

/** App identifier for entry point and device menu. */
export type SimulatorApp = "phone" | "email" | "messages" | "internet" | "home";

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
export interface SimulatorContact {
    id: string;
    display_name: string;
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

export interface SimulatorEmailMessageDetail {
    id: string;
    subject: string;
    from: string;
    from_addr?: string;
    from_display_name?: string;
    to?: string;
    cc?: string;
    date_at?: string;
    unread?: boolean;
    body: string;
    reply_to?: string;
    return_path?: string;
    links?: Array<{ href: string; text: string; title?: string }>;
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
    from: "them" | "me";
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
    type: "text" | "password" | "email";
    label: string;
}

export interface SimulatorPageButton {
    label?: string;
    href?: string;
    targetPageId?: string;
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

export interface SimulatorPhoneApp {
    history?: Array<{
        id: string;
        number?: string;
        name?: string;
        direction?: "in" | "out" | "missed" | "voicemail";
        timestamp?: string;
    }>;
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
    voicemail_transcript?: string;
}

export interface SimulatorHomeApp {
    home?: {
        widgets?: Array<{ id: string; type?: string; label?: string }>;
    };
    store?: {
        featured_apps?: Array<{ id: string; name: string }>;
    };
    settings?: {
        sections?: Array<{ id: string; title: string }>;
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

/** Phone screen ids used by session/runtime navigation. */
export type SimulatorPhoneScreenId =
    | "history"
    | "contacts"
    | "add_contact"
    | "dial"
    | "incoming_call"
    | "voicemail"
    | "directory";

/** Email screen ids used by session/runtime navigation. */
export type SimulatorEmailScreenId = "list" | "detail" | "compose" | "outbox" | "trash";

/** Messages screen ids used by session/runtime navigation. */
export type SimulatorMessagesScreenId = "threads" | "thread_detail" | "new_thread";

/** Internet entry screen for full-device authoring (`pages` list vs single `page`). */
export type SimulatorInternetScreenId = "pages" | "page";

/** Home screen ids used by session/runtime navigation. */
export type SimulatorHomeScreenId = "home" | "store" | "settings";

/** Union of app screen id types for authoring helpers. */
export type SimulatorScreenId =
    | SimulatorPhoneScreenId
    | SimulatorEmailScreenId
    | SimulatorMessagesScreenId
    | SimulatorInternetScreenId
    | SimulatorHomeScreenId;
