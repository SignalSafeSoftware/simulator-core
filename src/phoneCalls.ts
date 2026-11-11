import type { SimulatorPhoneApp } from './devicePayload.js';

export const SimulatorCallType = Object.freeze({
    Incoming: 'incoming',
    Calling: 'calling',
    Received: 'received',
    Accepted: 'accepted',
    Missed: 'missed',
    Voicemail: 'voicemail',
    Unanswered: 'unanswered',
    Cancelled: 'cancelled',
    Declined: 'declined',
    /** Imported outgoing record without enough evidence to determine its outcome. */
    Outgoing: 'outgoing',
} as const);
export type SimulatorCallType = (typeof SimulatorCallType)[keyof typeof SimulatorCallType];
export interface SimulatorCallRecord {
    id: string;
    type: SimulatorCallType;
    name?: string;
    number?: string;
    timestamp?: string;
    duration_seconds?: number;
    transcript?: string;
    avatar_url?: string;
    caller_title?: string;
}
/** Explicit, loss-preserving conversion of the previous three authored collections. */
export function unifyPhoneCalls(phone: SimulatorPhoneApp): SimulatorCallRecord[] {
    if (phone.calls) {
        if (phone.history || phone.incoming_call || phone.voicemail) {
            throw new Error(
                'Phone calls cannot be combined with legacy history, incoming_call or voicemail. Migrate the collections first.',
            );
        }
        return phone.calls;
    }
    const calls: SimulatorCallRecord[] = (phone.history ?? []).map(({ direction, ...entry }) => ({
        ...entry,
        id: entry.id,
        type:
            direction === 'out'
                ? entry.duration_seconds && entry.duration_seconds > 0
                    ? SimulatorCallType.Accepted
                    : SimulatorCallType.Outgoing
                : direction === 'missed'
                  ? SimulatorCallType.Missed
                  : direction === 'voicemail'
                    ? SimulatorCallType.Voicemail
                    : SimulatorCallType.Received,
        name: entry.name,
        number: entry.number,
        timestamp: entry.timestamp,
        duration_seconds: entry.duration_seconds,
    }));
    const uniqueId = (base: string) => {
        let id = base;
        let suffix = 1;
        while (calls.some((call) => call.id === id)) id = `${base}-${suffix++}`;
        return id;
    };
    const incoming = phone.incoming_call;
    if (incoming)
        calls.push({
            id: uniqueId('incoming-call'),
            type: SimulatorCallType.Incoming,
            name: incoming.caller_name,
            number: incoming.phone_number,
            transcript: incoming.transcript,
            avatar_url: incoming.avatar_url,
            caller_title: incoming.caller_title,
        });
    const voicemail = phone.voicemail;
    if (voicemail) {
        const matches = calls.filter(
            (call) =>
                call.type === SimulatorCallType.Voicemail &&
                (voicemail.phone_number
                    ? call.number === voicemail.phone_number
                    : Boolean(voicemail.caller_name) && call.name === voicemail.caller_name) &&
                (!voicemail.timestamp || call.timestamp === voicemail.timestamp),
        );
        const match = matches.length === 1 ? matches[0] : undefined;
        if (match) {
            match.transcript = voicemail.transcript;
            match.number = voicemail.phone_number || match.number;
        } else
            calls.push({
                id: uniqueId('voicemail'),
                type: SimulatorCallType.Voicemail,
                name: voicemail.caller_name,
                number: voicemail.phone_number,
                timestamp: voicemail.timestamp,
                transcript: voicemail.transcript,
            });
    }
    return calls;
}

/** Migrate authoring data without mutating input, discarding fields or guessing outcomes. */
export function migratePhoneCalls(phone: SimulatorPhoneApp): SimulatorPhoneApp {
    const result: SimulatorPhoneApp = { ...phone, calls: unifyPhoneCalls(phone) };
    delete result.history;
    delete result.incoming_call;
    delete result.voicemail;
    return result;
}
