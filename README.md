# Guardrails Lab

Guardrails Lab is an educational reference implementation for adding
transparent safety checks around an AI-style response pipeline.

The project demonstrates three controls:

1. **Input screening** detects explicit restricted terms and known prompt
   injection phrases.
2. **Authorized retrieval** filters documents by role before evaluating their
   relevance to a query.
3. **Output verification** redacts structured personal data and rejects
   selected factual claims that are unsupported by approved source context.

## Project status

The interactive web demo is retained in this repository, but public access to
its hosted deployment has intentionally been disabled to prevent outside
traffic and avoid unnecessary usage. The application can still be run locally.

## Repository structure

```text
.
├── app.py                 # Python guardrail reference implementation
├── test_app.py            # Python unit tests
├── requirements.txt       # Python dependencies
└── web/
    ├── app/               # Interactive web interface
    ├── lib/guardrails.ts  # Browser demo pipeline
    ├── public/            # Artwork and social assets
    └── tests/             # Rendered application tests
```

## Run the Python demonstration

Python 3.12 or newer is recommended.

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python app.py
```

Run the Python tests with:

```bash
python -m unittest -v
```

## Run the web application

The web application requires Node.js 22.13 or newer.

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000` in a browser.

Validate the web application with:

```bash
npm test
npm run lint
```

## Included scenarios

The interactive interface includes deterministic examples for:

- a safe engineering request;
- an engineering user attempting to retrieve HR salary information;
- an explicit prompt-injection attempt; and
- a response containing a synthetic email address that must be redacted.

The role selector and all documents are synthetic. No model API or API key is
required to use the demo.

## Security limitations

This repository is a teaching example, not a complete production security
system.

- Regex and keyword matching cannot detect every prompt-injection technique.
- A browser-selected role must never be trusted as production authorization.
- Production roles should come from authenticated server-side identity.
- Access controls should be enforced at the data layer before retrieval.
- Real deployments should add rate limits, request-size limits, safe audit
  logging, and broader output validation.
- Secrets must be provided through environment variables or a managed secret
  store and must never be committed to Git.

## Environment configuration

Copy `.env.example` to `.env` and fill in local values when a future integration
requires them:

```bash
cp .env.example .env
```

The current deterministic demo does not use `OPENAI_API_KEY`.

## License

The source code is available under the [MIT License](LICENSE).
