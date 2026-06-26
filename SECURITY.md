# Security Policy

## Supported versions

Node.js 18 or newer (see `package.json` `engines`). Only the latest published release line receives security fixes.

## Reporting a vulnerability

Please report suspected security vulnerabilities **privately**. Do **not** open a public GitHub issue for security reports.

Email: security@signalsafe.software

Include a description, reproduction steps, affected versions, and impact if known. We aim to acknowledge reports within five business days.


## Security boundaries

This package is a **headless simulator runtime**. It does not provide routing, HTTP/API endpoints, authentication, or UI rendering.

- Scenario payloads (`TreeSpecWire` and related session inputs) are treated as **authoring/trusted content** unless the host application validates them first.
- The host application is responsible for validating payloads before passing them to this library, controlling who can start sessions, and securing persisted session state.
- This library does not sandbox JavaScript execution beyond stepping the scenario graph.
