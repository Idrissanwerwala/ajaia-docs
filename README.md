# Ajaia Docs

A deliberately scoped, collaborative rich-text document editor. It supports creation, renaming, browser editing, automatic persistence, plain-text/Markdown imports, and owner-managed sharing.

## Run locally

Requirements: Node.js 18 or later.

```bash
cd ajaia-docs
npm start
```

Open `http://localhost:3000`.

Run the automated checks with `npm test`.

## Review flow

The app is seeded with three simulated accounts: Ava Patel, Maya Chen, and Leo Martin. Start as Ava, open **Welcome to Ajaia Docs**, share it with Leo, then switch the account selector to Leo. The document appears under **Shared with you** and is intentionally view-only. Switch back to Ava to edit it.

Use **Import file** to create an editable document from a `.txt` or `.md` file up to 500 KB. Other types are intentionally not supported in this prototype and the UI says so.

## Deployment

The application has no external services or build step. Deploy it to any Node-compatible host using `npm start`; set `PORT` if the host requires it. Add the resulting public URL to `video-url.txt` and `SUBMISSION.md` before submitting.

## Project layout

- `server.js` — Node HTTP server, JSON API, authorization logic, and file-backed persistence
- `public/` — responsive browser experience
- `data/store.json` — seeded sample data and durable local data store
- `test/` — Node built-in test suite

See [ARCHITECTURE.md](ARCHITECTURE.md) for the product and implementation decisions.
