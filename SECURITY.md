# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| `main` (latest) | ✅ |
| Older tags | Best-effort |

## Reporting a vulnerability

Please **do not** open a public issue for security reports.

1. Email or contact the maintainer via [matthummel.com/contact](https://matthummel.com/contact/)
2. Or use GitHub’s private vulnerability reporting on this repository (if enabled)

Include:

- Description and impact
- Steps to reproduce
- Affected paths (`play/`, `wordpress-plugin/`, etc.)
- Suggested fix (optional)

We aim to acknowledge within 7 days and ship a fix or mitigation as soon as practical.

## Scope notes

- This is a client-side game + optional WordPress shortcode embed
- Treat custom music / background image URLs as untrusted input on sites that allow editors to set them
- Do not embed secrets in share hashes or `localStorage` payloads
