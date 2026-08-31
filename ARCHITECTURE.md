# Architecture note

## Product slice

I prioritized the smallest end-to-end workflow that makes a shared document feel real: create or import, edit with formatting, persist, reopen, and share. The visual design keeps the editor at the center and makes ownership explicit in the document list.

## Design

The frontend is a dependency-free browser application served by a small Node HTTP server. Rich text is edited with a `contenteditable` surface and a compact toolbar; the resulting HTML is stored as the document body, so headings, lists, and inline formatting survive refreshes. Saves are debounced to avoid a request per keystroke.

Data lives in `data/store.json`. That makes the submission runnable without accounts or a database while preserving documents and sharing grants across server restarts. The server authorizes every document request from a simulated current-user header. Owners can edit and grant access; recipients can see clearly labelled, view-only shared documents.

## Deliberate tradeoffs

- **No real authentication:** seeded accounts and an account switcher make sharing reviewable in seconds. A production version would use sessions plus a users table.
- **No collaborative cursors or conflict resolution:** autosave is appropriate for a single-writer prototype but not simultaneous editing. The next investment would be versioning plus an operational-transform/CRDT service.
- **`.txt` and `.md` import only:** this keeps import safe and predictable. DOCX conversion and attachments would be the next file-workflow expansion.
- **File JSON persistence:** clear and zero-config for review; SQLite/Postgres migrations, structured permission rows, and object storage are the production path.

## Reliability notes

The server applies title and size validation, returns useful request errors, checks document authorization, and strips scripts/inline event handlers from stored editor HTML. The included unit tests cover the sanitization and visibility rules.
