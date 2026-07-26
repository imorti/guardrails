# Guardrails Lab

Guardrails Lab is a public, interactive demonstration of a transparent AI
safety pipeline. It shows how an application can:

1. screen prompts for explicit policy violations;
2. apply role-based access before document retrieval; and
3. redact structured personal data before returning a response.

The demo uses only synthetic documents and deterministic responses. It does not
call an external model or require an API key.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validate

```bash
npm test
npm run lint
```

## Important limitation

This is an educational reference implementation. Its pattern matching is not a
complete security boundary, and its browser-selected roles must never be used
as production authorization. A production application should derive roles from
authenticated server-side identity and enforce access at the data layer.
