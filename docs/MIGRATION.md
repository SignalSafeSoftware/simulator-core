# Canonical simulator contracts

This local prerelease removes compatibility paths. Adopt core, React, device and theme together; update both hosts and rebuild their dependency caches.

- Import `fullDeviceToPayload` from `@signalsafe/simulator-react/adapters/deviceToSession`. The datasource module no longer exports `deviceJsonToPayload`. Device data maps directly; `templateDetailToPayload` adds API identity without inventing a template DTO. A supported `entry_point.app` is required; transport `channel` is not a routing fallback.
- Use `SIMULATOR_DEVICE_SHELL_SCREEN_CLASS_NAMES` and `simulator-device-shell--screen-*`. The old screen-class constant and phone-shell CSS selectors are removed.
- Every `SimulatorCallHistoryEntry` must provide `kind`. Labels remain display/search text, not a source of call direction.
- TreeSpec input uses `choices` and terminal `END`. `options` and `__END__` are rejected. Choice feedback also reads `choices` only.
- Device voicemail uses `phone.voicemail.transcript`. Device browser buttons use `target_page_id`; their converted session view models use `targetPageId`.
- Button tones use `neutral`, `primary-outline`, `neutral-outline` and `dark-outline`, replacing `secondary` and `outline-*` aliases. `SimulatorButtonTone` defines the supported set.

## Existing data

The core repository supplies an offline migration tool. Preview an export with `node scripts/migrate-input-json.mjs INPUT.json`. Exit 0 means canonical input, 1 means migration is needed, and 2 means an error or conflicting fields. Write a separate converted file with `node scripts/migrate-input-json.mjs INPUT.json --output NEW.json`. The tool never overwrites existing files and is idempotent. Conflicting old/new values require manual review. Missing device entry points require authoring a real entry point; the tool does not guess a screen from the template channel.

Migrate exported persisted data before loading it through the new packages. Production databases and browser storage are not automatically rewritten by a package install.

## Supported APIs retained

Editable `value` and immutable `datasource` inputs have different update/reset semantics. `onSimulatorEvent` carries interaction telemetry; `onNavigation` controls navigation and `onNavigationEvent` observes it. Numeric IDs and optional authored SMS message IDs are valid inputs. None of these is a forwarding alias or a deprecated screen implementation.
