# Security policy

## Reporting a vulnerability

Please do **not** open a public issue for security problems.

Report privately through GitHub:
[open a security advisory](https://github.com/Meykiio/dz-green/security/advisories/new).

Include what you found, where it lives (file, flow, or endpoint), and how to
reproduce it. We aim to acknowledge within a few days.

## Things we hold ourselves to

- The service-role key never appears in client code or git history.
- Reporter PII (fire reporter name/phone) is protected by column-level grants —
  client queries must never select it, and `select *` failing on that table is
  intentional.
- Raw IPs are never stored — `submission_meta.ip_hash` only.
- Photos live in a private bucket, served only through the app's photo proxy.
